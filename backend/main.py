from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.questions import generate_question_and_testcases, question_store, get_hidden_testcases
from history_tracking.user_history import UserHistory
from backend.models import User
from test_evaluator.evaluate import evaluate_answer
from test_evaluator.hint_generator import get_syntax_hint
from test_evaluator.docker_runner import run_in_docker
from faster_whisper import WhisperModel
from typing import List
import tempfile
import os

app = FastAPI()

# Model Setup
model = WhisperModel("base", device="cpu")

# DB Setup
Base.metadata.create_all(bind=engine)

# CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class TestRequest(BaseModel):
    user_id: str
    code: str

class SubmitRequest(BaseModel):
    user_id: str
    code: str

class QuestionRequest(BaseModel):
    user_id: str
    tech_stack: str

class EmailSchema(BaseModel):
    email: str

class QAItem(BaseModel):
    question: str
    answer: str

class InterviewRequest(BaseModel):
    chat_history: List[QAItem]

class InterviewResponse(BaseModel):
    next_question: str

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.get("/")
def root():
    return {"message": "Backend running"}

@app.get("/get-question")
def get_question(user_id: str, tech_stack: str):
    generate_question_and_testcases(user_id, tech_stack)
    question_data = question_store.get(user_id)
    if not question_data:
        return {"error": "Failed to generate question."}

    return {
        "question": question_data.get("question", ""),
        "testcases": question_data.get("sample_cases", [])
    }

@app.post("/evaluate-answer")
def evaluate(req: SubmitRequest):
    question = question_store.get(req.user_id, {}).get("question")
    if not question:
        return {"error": "No question found for user."}
    review = evaluate_answer(question, req.code)
    return {"review": review}

@app.post("/code-hint")
def code_hint(req: TestRequest):
    hint = get_syntax_hint(req.code)
    return {"hint": hint}

@app.post("/run-tests")
def run_tests(req: SubmitRequest):
    testcases = get_hidden_testcases(req.user_id)
    if not testcases:
        return {"result": []}

    results = []
    for i, case in enumerate(testcases):
        result = run_in_docker(req.code, case["input"], str(case["expected_output"]))
        results.append({
            "testcase": i + 1,
            "input": case["input"],
            "expected": case["expected_output"],
            "actual": result["actual_output"],
            "passed": result["passed"]
        })

    return {"result": results}


@app.post("/resume-upload")
async def resume_upload(file: UploadFile = File(...)):
    file_bytes = await file.read()
    score = score_resume_from_bytes(file_bytes)
    if score is None:
        return {"error": "Could not process resume."}
    db = SessionLocal()
    history = UserHistory(
        user_id="test_user_123",
        action_type="resume_upload",
        question="N/A",
        answer="N/A",
        evaluation=f"Resume Score: {score:.2f} / 100"
    )
    db.add(history)
    db.commit()
    db.close()
    return {"resume_score": f"{score:.2f} / 100"}

@app.post("/register")
def register_user(data: EmailSchema, db: Session = Depends(get_db)):
    email = data.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        new_user = User(email=email)
        db.add(new_user)
        db.commit()
    return {"message": "User registered"}

@app.get("/history")
def get_history(user_id: str, db: Session = Depends(get_db)):
    records = db.query(UserHistory).filter(UserHistory.user_id == user_id).all()
    return [{
        "type": r.action_type,
        "question": r.question,
        "answer": r.answer,
        "evaluation": r.evaluation,
        "timestamp": r.timestamp.isoformat()
    } for r in records]

@app.post("/interview-question", response_model=InterviewResponse)
def send_question(request: InterviewRequest):
    return {"next_question": generate_next_question(request.chat_history)}

@app.post("/interview-evaluate")
def evaluate_interview(request: InterviewRequest):
    return {"feedback": evaluate_answer(request.chat_history)}

@app.post("/interview-transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(await file.read())
        path = f.name
    segments, _ = model.transcribe(path)
    os.remove(path)
    return {"text": " ".join([s.text for s in segments]).strip()}
