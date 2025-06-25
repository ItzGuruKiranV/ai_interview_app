from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import Base, engine, SessionLocal
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.evaluate import evaluate_answer
from test_evaluator.questions import generate_question_and_testcases, get_test_cases_for_user, test_case_store
from test_evaluator.hint_generator import get_hint_for_question
from history_tracking.user_history import UserHistory

import subprocess, tempfile, json

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.post("/test-code")
def test_code(req: TestRequest):
    test_cases_raw = get_test_cases_for_user(req.user_id)
    
    if not test_cases_raw or test_cases_raw.strip() == "":
        return {"error": "No test cases available for this user. Please fetch a new question."}

    try:
        test_cases = json.loads(test_cases_raw)
    except json.JSONDecodeError:
        return {"error": "Test cases are not in valid JSON format."}

    results = []

    for case in test_cases:
        input_str = case["input"]
        expected = str(case["expected"])
        full_code = f"""{req.code}\nprint(solution({input_str}))"""

        try:
            with tempfile.NamedTemporaryFile(mode="w+", suffix=".py", delete=False) as f:
                f.write(full_code)
                f.flush()
                output = subprocess.check_output(["python", f.name], timeout=2, text=True).strip()
        except subprocess.CalledProcessError as e:
            output = e.output.strip()
        except Exception as e:
            output = str(e)

        results.append({
            "input": input_str,
            "expected": expected,
            "actual": output,
            "passed": output == expected
        })

    return {"result": results}


@app.post("/evaluate-answer")
def submit_code(req: SubmitRequest):
    from test_evaluator.evaluate import co

    question = test_case_store.get(req.user_id, {}).get("question")
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

    response = co.generate(
        model="command-r",
        prompt=prompt,
        max_tokens=200,
    )
    return {"review": response.generations[0].text.strip()}

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
