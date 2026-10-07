from fastapi import FastAPI, UploadFile, File, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import jwt
import os
import time
import json
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from jwt import PyJWKClient

# Load .env variables from project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

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
did = DId(api_key=os.getenv("DID_API_KEY") or "")

# ========== FASTAPI INIT ==========
app = FastAPI(title="InterviewElevate API", version="1.0.0")

# ========== CORS ==========
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== DATABASE SETUP ==========
DB_PATH = Path(os.getenv("DB_PATH", str(Path(__file__).resolve().parent.parent / "history.db")))

AUTH_REQUIRED = os.getenv("AUTH_REQUIRED", "false").lower() == "true"
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
clerk_jwks_client = PyJWKClient(CLERK_JWKS_URL) if CLERK_JWKS_URL else None
ENABLE_CODE_EXECUTION = os.getenv("ENABLE_CODE_EXECUTION", "true").lower() == "true"


def get_current_user(authorization: Optional[str] = Header(default=None)):
    if not AUTH_REQUIRED:
        return None
    if not CLERK_ISSUER or clerk_jwks_client is None:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue.")

    token = authorization.split(" ", 1)[1]
    try:
        signing_key = clerk_jwks_client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"require": ["sub", "exp", "iss"]},
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session.") from exc

    return {"id": claims["sub"]}


def get_owner_id(current_user, fallback_id: str) -> str:
    return current_user["id"] if current_user else fallback_id

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            session_type TEXT NOT NULL,
            score TEXT,
            feedback TEXT,
            tech_stack TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

# ========== Pydantic SCHEMAS ==========
class RegisterRequest(BaseModel):
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

class SaveHistoryRequest(BaseModel):
    email: str
    session_type: str
    score: Optional[str] = None
    feedback: Optional[str] = None
    tech_stack: Optional[str] = None

# ========== ROUTES ==========

@app.get("/")
def root():
    return {"message": "✅ InterviewElevate Backend Running!"}

# ---- User Registration ----
@app.post("/register")
def register_user(req: RegisterRequest, current_user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO users (email) VALUES (?)", (req.email,)
        )
        conn.commit()
        return {"message": "User registered", "email": req.email}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

# ---- History ----
@app.get("/history")
def get_history(email: str, current_user=Depends(get_current_user)):
    owner_id = get_owner_id(current_user, email)
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM interview_history WHERE email=? ORDER BY created_at DESC LIMIT 20",
            (owner_id,)
        ).fetchall()
        return {
            "email": email if current_user is None else None,
            "history": [dict(r) for r in rows]
        }
    except Exception as e:
        return {"error": str(e), "history": []}
    finally:
        conn.close()

@app.post("/save-history")
def save_history(req: SaveHistoryRequest, current_user=Depends(get_current_user)):
    owner_id = get_owner_id(current_user, req.email)
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO interview_history (email, session_type, score, feedback, tech_stack)
               VALUES (?, ?, ?, ?, ?)""",
            (owner_id, req.session_type, req.score, req.feedback, req.tech_stack)
        )
        conn.commit()
        return {"message": "History saved"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

# ---- Coding Test ----
@app.get("/get-question")
def get_question(user_id: str, tech_stack: str, current_user=Depends(get_current_user)):
    owner_id = get_owner_id(current_user, user_id)
    generate_question_and_testcases(owner_id, tech_stack)
    q_data = question_store.get(owner_id)
    if not q_data:
        return {"error": "Failed to generate question."}
    return {
        "question": q_data.get("question", ""),
        "testcases": q_data.get("sample_cases", [])
    }

@app.post("/evaluate-answer")
def evaluate(req: SubmitRequest, current_user=Depends(get_current_user)):
    owner_id = get_owner_id(current_user, req.user_id)
    q = question_store.get(owner_id, {}).get("question")
    if not q:
        return {"error": "No question found for this user."}
    return {"review": evaluate_code_answer(q, req.code)}

@app.post("/code-hint")
def code_hint(req: TestRequest, current_user=Depends(get_current_user)):
    return {"hint": get_syntax_hint(req.code)}

@app.post("/run-tests")
def run_tests(req: SubmitRequest, current_user=Depends(get_current_user)):
    if not ENABLE_CODE_EXECUTION:
        raise HTTPException(status_code=503, detail="Code execution is disabled on this hosted demo.")
    owner_id = get_owner_id(current_user, req.user_id)
    results = []
    hidden = get_hidden_testcases(owner_id) or []
    for i, case in enumerate(hidden):
        result = run_in_docker(req.code, case["input"], str(case["expected_output"]))
        results.append({
            "testcase": i + 1,
            "input": case["input"],
            "expected": case["expected_output"],
            "actual": result["actual_output"],
            "passed": result["passed"]
        })
    return {"result": results}

# ---- Interview ----
@app.post("/interview-question", response_model=InterviewResponse)
def send_question(req: InterviewRequest, current_user=Depends(get_current_user)):
    return {
        "next_question": generate_next_question(
            chat_history=req.chat_history,
            tech_stack=req.tech_stack
        )
    }

@app.post("/interview-evaluate")
def evaluate_interview(req: InterviewRequest, current_user=Depends(get_current_user)):
    # Convert QAItem list to list of dicts for evaluator
    history_as_dicts = [{"question": item.question, "answer": item.answer} for item in req.chat_history]
    feedback = evaluate_interview_answer(history_as_dicts)
    return {"feedback": feedback}

# ---- Resume ----
@app.post("/resume-upload")
async def resume_upload(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    file_bytes = await file.read()
    score = score_resume_from_bytes(file_bytes)
    if score is None:
        return {"error": "Could not process resume. Make sure it's a readable PDF."}
    return {"resume_score": f"{score:.2f} / 100"}

# ---- D-ID Avatar ----
@app.post("/did-avatar")
def create_did_avatar(body: ScriptInput, current_user=Depends(get_current_user)):
    did_key = os.getenv("DID_API_KEY", "")
    if not did_key:
        # Return empty if no D-ID key configured – frontend handles gracefully
        return {"video_url": None, "message": "D-ID API key not configured. Skipping avatar."}
    try:
        result = did.text_to_video(script=body.text)
        video_url = result.get("video_url")
        if not video_url:
            return {"video_url": None, "error": "No video URL returned from D-ID."}
        return {"video_url": video_url}
    except Exception as e:
        return {"video_url": None, "error": str(e)}
