from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.evaluate import evaluate_answer
from test_evaluator.questions import generate_question_and_testcases, question_store
from test_evaluator.hint_generator import get_hint_for_question
from history_tracking.user_history import UserHistory

import subprocess, tempfile, json

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
    code: str

class TestRequest(BaseModel):
    user_id: str
    code: str

class SubmitRequest(BaseModel):
    user_id: str
    code: str

class QuestionRequest(BaseModel):
    user_id: str
    tech_stack: str

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
    generate_question_and_testcases(user_id, tech_stack)  # Generates and stores

    # Now fetch the generated data
    question_data = question_store.get(user_id)

    if not question_data:
        return {"error": "Failed to generate question."}

    return {
        "question": question_data.get("question", ""),
        "testcases": question_data.get("testcases", [])
    }




@app.post("/ask-hint")
def ask_hint(data: TestRequest):
    from test_evaluator.evaluate import co

    prompt = f"""
You are an expert developer. Give suggestions to improve this code:
- Spot logical flaws
- Suggest refactoring
- Recommend performance or readability improvements

Code:
{data.code}

Return detailed and clear suggestions:
"""

    response = co.chat(
        model="command-r",
        message=prompt,
        max_tokens=300,
    )
    return {"hint": response.text.strip()}




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
def get_history(user_id: str, db: Session = Depends(get_db)):
    records = db.query(UserHistory).filter(UserHistory.user_id == user_id).all()
    return [
        {
            "type": r.action_type,
            "question": r.question,
            "answer": r.answer,
            "evaluation": r.evaluation,
            "timestamp": r.timestamp.isoformat()
        } for r in records
    ]
@app.post("/code-hint")
def code_hint(data: TestRequest):
    from test_evaluator.evaluate import co
    prompt=f"""
You are a Python syntax assistant.

The user is writing some code. Based on the partial code provided below, suggest the most likely correct **Python syntax** continuation or correction.

Only return one corrected or completed line of Python **code**, no explanation.

Code:
{data.code}

Response (1 line of Python syntax only):
"""
    response=co.chat(
        model="command-r",
        message=prompt,
        max_tokens=60,
    )
    return {"hint": response.text.strip()}