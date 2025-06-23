import os
from dotenv import load_dotenv
from pathlib import Path
import cohere

# Load .env from parent directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("COHERE_API_KEY")

# Initialize cohere client
co = cohere.Client(api_key)


def evaluate_answer(question: str, answer: str) -> str:
    """
    Evaluate a candidate's answer using Cohere LLM.
    Returns a string with score and feedback.
    """

    if not answer.strip():
        return "Score: 0/10\nFeedback: No answer provided."

    prompt = f"""
You are an expert Python interviewer.

Evaluate the candidate's answer based on correctness, clarity, and relevance.

### Evaluation Rules:
- If answer is blank or completely unrelated → Score: 0/10
- If answer is partially correct → Score: 3-6/10
- If answer is mostly correct with small issues → Score: 7-9/10
- If answer is perfect → Score: 10/10

### Respond in EXACTLY this format:
Score: <score>/10
Feedback: <one-line constructive feedback>

### Example:
Question: Write a Python function to add two numbers.
Answer: def add(a, b): return a + b

Response:
Score: 10/10
Feedback: Perfect implementation.

Now evaluate this:
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
        output = response.text

        if "Score:" not in output or "Feedback:" not in output:
            return f"❌ Invalid response from LLM:\n{output}"

        return output

    except Exception as e:
        return f"❌ LLM Error: {str(e)}"
