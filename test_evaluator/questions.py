import os
import cohere
from dotenv import load_dotenv

load_dotenv()
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

test_case_store = {}

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

    test_case_prompt = f"""
Create 3 test cases in JSON for this question:
"{question}"

Use this format:
[
  {{ "input": "5, 3", "expected": "8" }},
  ...
]
Return ONLY JSON.
"""
    test_case_response = co.generate(
        model="command",
        prompt=test_case_prompt,
        max_tokens=150,
        temperature=0.6,
    )
    test_cases = test_case_response.generations[0].text.strip()

    test_case_store[user_id] = {
        "question": question,
        "test_cases": test_cases
    }

    return question

def get_test_cases_for_user(user_id: str):
    return test_case_store.get(user_id, {}).get("test_cases")
