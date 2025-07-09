# test_evaluator/evaluate.py

import os
import cohere
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("COHERE_API_KEY")

# Init Cohere client
co = cohere.Client(api_key)

def evaluate_answer(question: str, answer: str) -> str:
    if not answer.strip():
        return "Score: 0/10\nFeedback: No answer provided."

    prompt = f"""
You are an expert Python interviewer.

Evaluate the candidate's answer based on correctness, clarity, and relevance.

### Evaluation Rules:
- If code is blank or unrelated → Score: 0/10
- Partial code or wrong logic → Score: 3-6/10
- Mostly correct with small issues → Score: 7-9/10
- Fully correct, clean code → Score: 10/10

### Format:
Score: <score>/10
Feedback: <short 1-line feedback>

Question: {question}
Answer: {answer}
"""

    try:
        response = co.chat(
            model="command-r",
            message=prompt,
            max_tokens=100,
            temperature=0.2
        )
        output = response.text.strip()

        if "Score:" not in output or "Feedback:" not in output:
            return f"❌ Invalid LLM response:\n{output}"

        return output

    except Exception as e:
        return f"❌ LLM Error: {str(e)}"
