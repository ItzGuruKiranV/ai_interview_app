import cohere
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

co = cohere.Client(os.getenv("COHERE_API_KEY"))


def evaluate_interview_answer(interaction_list):
    """
    Evaluate the interview interaction list.
    Each item is a dict with 'question' and 'answer' keys.
    """
    if not interaction_list:
        return "No responses recorded to evaluate."

    formatted = "\n".join([
        f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}"
        for item in interaction_list
    ])

    prompt = f"""You are an experienced technical interview coach.

Below is a transcript of a mock technical interview:

{formatted}

Please evaluate the candidate:
1. Give a score from 1 to 10 (e.g. Score: 7/10)
2. Mention 1-2 specific strengths
3. Mention 1-2 areas to improve
4. Keep the total feedback under 5 lines.
"""

    try:
        res = co.generate(model="command", prompt=prompt, max_tokens=200)
        return res.generations[0].text.strip()
    except Exception as e:
        return f"Could not evaluate interview: {str(e)}"
