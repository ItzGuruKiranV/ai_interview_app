from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from resume_module.scorer import score_resume_from_bytes
from test_evaluator.evaluate import evaluate_answer
from test_evaluator.questions import rand_question
from fastapi import Request
from pydantic import BaseModel


class AnswerRequest(BaseModel):
    question: str
    answer: str




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend running"}

@app.post("/resume-upload")
async def resume_upload(file: UploadFile = File(...)):
    file_bytes = await file.read()
    print(f"✅ Received PDF of size: {len(file_bytes)}")

    score = score_resume_from_bytes(file_bytes)
    if score is None:
        return {"error": "Could not process resume."}

    return {"resume_score": f"{score:.2f} / 100"}




@app.get("/get-questions")
def get_rand_question():
    question = rand_question()
    return {"Question ::" : question }


    
@app.post("/evaluate-answer")
def evaluate_answer_api(data: AnswerRequest):
    result = evaluate_answer(data.question, data.answer)
    return {"evaluation": result}
