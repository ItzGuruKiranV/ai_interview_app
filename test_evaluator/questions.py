import os
import cohere
from dotenv import load_dotenv

load_dotenv()
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

question_store = {}

def generate_question_and_testcases(user_id: str, tech_stack: str):
    question_prompt = f"""
Generate a beginner-to-intermediate coding interview question for {tech_stack}.
Return ONLY the question.
"""
    question_response = co.generate(
        model="command",
        prompt=question_prompt,
        max_tokens=100,
        temperature=0.7,
    )
    question = question_response.generations[0].text.strip()
    question_store[user_id] = {
        "question": question
    }
    return question