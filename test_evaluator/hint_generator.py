# test_evaluator/hint_generator.py

import cohere
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env for COHERE_API_KEY
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(api_key)


def get_syntax_hint(code: str) -> str:
    """
    Given partial user code, returns a syntax correction or completion.
    """
    prompt = f"""
You are a Python syntax assistant.

The user is writing some code. Based on the partial code provided below,
suggest the most likely correct **Python syntax** continuation or correction.

Only return one corrected or completed line of Python **code**, no explanation.

Code:
{code}

Response (1 line of Python syntax only):
"""
    try:
        response = co.chat(
            model="command-r",
            message=prompt,
            max_tokens=60,
        )
        return response.text.strip()
    except Exception as e:
        return f"❌ LLM Error: {str(e)}"
