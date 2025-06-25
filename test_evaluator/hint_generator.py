import cohere
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(api_key)

def get_hint_for_question(question: str) -> str:
    prompt = f"""
    You are a helpful Python mentor. A student asked: "{question}"
    
    Give them a HINT, not the full code.

    - Include syntax structure if needed.
    - Do NOT write actual code unless it's just a small example.
    - Make it sound like you're helping them think.

    Hint:
    """
    try:
        response = co.chat(model="command-r", message=prompt)
        return response.text.strip()
    except Exception as e:
        return f"❌ LLM Error: {str(e)}"
