import os
from dotenv import load_dotenv
import cohere

# Load the .env file from one level up
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("CO_API_KEY")


# Initialize client
co = cohere.Client(api_key)

def evaluate_answer(question, user_answer):
    prompt = f"""
You are an AI interview evaluator.
Evaluate the answer below based only on the question.
Give score out of 10, one-line feedback, and a sample perfect answer whose score may be valued 10.

Question: {question}
Answer: {user_answer}
"""

    response = co.chat(
        message=prompt,
        model="command-r",
    )

    return response.text
