from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import os
import time
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# ========== DATABASE & MODELS ==========
from backend.database import Base, engine, SessionLocal
from backend.models import User
from history_tracking.user_history import UserHistory

# ========== MODULES ==========
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.questions import generate_question_and_testcases, question_store, get_hidden_testcases
from test_evaluator.evaluate import evaluate_answer as evaluate_code_answer
from test_evaluator.hint_generator import get_syntax_hint
from test_evaluator.docker_runner import run_in_docker
from interview_module.interview_question_generatr import generate_next_question
from interview_module.evaluator import evaluate_interview_answer

# ========== D-ID INTEGRATION ==========
from d_id.client import DId
did = DId(api_key=os.getenv("DID_API_KEY"))

# ========== FASTAPI INIT ==========
app = FastAPI()

# ========== CORS ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== DATABASE SETUP ==========
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== Pydantic SCHEMAS ==========
class EmailSchema(BaseModel):
    email: str

class QAItem(BaseModel):
    question: str
    answer: str

class InterviewRequest(BaseModel):
    chat_history: List[QAItem]
    tech_stack: str = "data structure"

class InterviewResponse(BaseModel):
    next_question: str

class SubmitRequest(BaseModel):
    user_id: str
    code: str

class TestRequest(BaseModel):
    user_id: str
    code: str

class ScriptInput(BaseModel):
    text: str

# ========== ROUTES ==========

@app.get("/")
def root():
    return {"message": "✅ Backend Running!"}

@app.post("/register")
def register_user(data: EmailSchema, db: Session = Depends(get_db)):
    email = data.email
    if not db.query(User).filter(User.email == email).first():
        db.add(User(email=email))
        db.commit()
    return {"message": "User registered"}

@app.get("/history")
def get_history(user_id: str, db: Session = Depends(get_db)):
    return [
        {
            "type": r.action_type,
            "question": r.question,
            "answer": r.answer,
            "evaluation": r.evaluation,
            "timestamp": r.timestamp.isoformat()
        }
        for r in db.query(UserHistory).filter(UserHistory.user_id == user_id).all()
    ]

@app.post("/resume-upload")
async def resume_upload(file: UploadFile = File(...)):
    file_bytes = await file.read()
    score = score_resume_from_bytes(file_bytes)
    if score is None:
        return {"error": "Could not process resume."}

    db = SessionLocal()
    db.add(UserHistory(
        user_id="test_user_123",
        action_type="resume_upload",
        question="N/A",
        answer="N/A",
        evaluation=f"Resume Score: {score:.2f} / 100"
    ))
    db.commit()
    db.close()

    return {"resume_score": f"{score:.2f} / 100"}

@app.get("/get-question")
def get_question(user_id: str, tech_stack: str):
    generate_question_and_testcases(user_id, tech_stack)
    q_data = question_store.get(user_id)
    if not q_data:
        return {"error": "Failed to generate question."}
    return {
        "question": q_data.get("question", ""),
        "testcases": q_data.get("sample_cases", [])
    }

@app.post("/evaluate-answer")
def evaluate(req: SubmitRequest):
    q = question_store.get(req.user_id, {}).get("question")
    return {"review": evaluate_code_answer(q, req.code)} if q else {"error": "No question found"}

@app.post("/code-hint")
def code_hint(req: TestRequest):
    return {"hint": get_syntax_hint(req.code)}

@app.post("/run-tests")
def run_tests(req: SubmitRequest):
    results = []
    for i, case in enumerate(get_hidden_testcases(req.user_id) or []):
        result = run_in_docker(req.code, case["input"], str(case["expected_output"]))
        results.append({
            "testcase": i + 1,
            "input": case["input"],
            "expected": case["expected_output"],
            "actual": result["actual_output"],
            "passed": result["passed"]
        })
    return {"result": results}

@app.post("/interview-question", response_model=InterviewResponse)
def send_question(req: InterviewRequest):
    return {
        "next_question": generate_next_question(
            chat_history=req.chat_history,
            tech_stack=req.tech_stack
        )
    }

@app.post("/interview-evaluate")
def evaluate_interview(req: InterviewRequest):
    return {"feedback": evaluate_interview_answer(req.chat_history)}

@app.post("/did-avatar")
def create_did_avatar(body: ScriptInput):
    try:
        # Step 1: Request avatar generation
        result = did.text_to_video(script=body.text)
        video_id = result.get("id")

        # Step 2: Poll for video readiness
        for _ in range(20):  # max ~20 seconds
            status = did.get_video_status(video_id)
            if status["status"] == "done":
                return {"video_url": status["result_url"]}
            time.sleep(1)

        return {"error": "Video generation timed out."}
    except Exception as e:
        return {"error": str(e)}
