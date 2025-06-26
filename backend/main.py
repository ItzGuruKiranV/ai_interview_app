from fastapi import FastAPI, UploadFile, File, Depends , Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.questions import generate_question_and_testcases, question_store
from test_evaluator.hint_generator import get_hint_for_question
from history_tracking.user_history import UserHistory
from backend.models import User
from interview_module.evaluator import evaluate_answer
from interview_module.interview_question_generatr import generate_next_question
from typing import List
from faster_whisper import WhisperModel
import tempfile
import os

model = WhisperModel("base", device="cpu")

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = "http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origins],
    allow_methods=["*"],
    allow_headers=["*"],
)

# SCHEMAS
class AnswerRequest(BaseModel):
    question: str
    answer: str

class HintRequest(BaseModel):
    question: str

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

# DB DEPENDENCY
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ROUTES
@app.get("/")
def root():
    return {"message": "Backend running"}

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

@app.get("/get-question")
def get_question(user_id: str, tech_stack: str):
    question = generate_question_and_testcases(user_id, tech_stack)
    return {"question": question}

@app.post("/ask-hint")
def ask_hint(data: HintRequest):
    if not data.question:
        return {"hint": "Please provide a question."}
    return {"hint": get_hint_for_question(data.question)}




@app.post("/evaluate-answer")
def submit_code(req: SubmitRequest):
    from test_evaluator.evaluate import co

    question = question_store.get(req.user_id, {}).get("question")
    if not question:
        return {"error": "No question found for user."}

    prompt = f"""
You are an expert code reviewer.

Evaluate this code strictly:
1. Logic correctness
2. Edge case handling
3. Code efficiency
4. Clean coding practices

Question:
{question}

Code:
{req.code}

Respond in this format:
Score: <score>/10
Feedback: <1-2 lines summary>
"""

    response = co.chat(
        model="command-r",
        message=prompt,
        max_tokens=200,
    )
    review = response.text.strip()
    return {"review": review}


@app.get("/history")
def get_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return {"email": user.email}
    return {"message": "User not found"}

@app.post("/register")
def register_user(data: EmailSchema, db: Session = Depends(get_db)):
    email = data.email
    print("✅ REGISTERED:", email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        new_user = User(email=email)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    return {"message": "User registered"}


@app.post("/interview-question", response_model=InterviewResponse)
def send_question(request: InterviewRequest):
    next_question = generate_next_question(request.chat_history)
    return {"next_question": next_question}

@app.post("/interview-evaluate")
def evaluate(request: InterviewRequest):
    feedback = evaluate_answer(request.chat_history)
    return {"feedback": feedback}


@app.post("/interview-transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(await file.read())
        f.flush()
        path = f.name

    segments, _ = model.transcribe(path)
    os.remove(path)

    full_text = " ".join([s.text for s in segments])
    return {"text": full_text.strip()}
