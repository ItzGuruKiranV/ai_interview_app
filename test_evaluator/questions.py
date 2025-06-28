import os
import cohere
from dotenv import load_dotenv
import re
import json

load_dotenv()
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

question_store = {}

def generate_question_and_testcases(user_id: str, tech_stack: str):
    # Step 1: Generate the question
    question_prompt = f"""
Generate a beginner-to-intermediate coding interview question in {tech_stack}.
Only output the question, no explanation.
"""
    question_response = co.generate(
        model="command",
        prompt=question_prompt,
        max_tokens=100,
        temperature=0.7,
    )
    question = question_response.generations[0].text.strip()

    # Step 2: Generate test cases
    testcase_prompt = f"""
For the following Python coding interview question, generate 3 to 5 diverse test cases.

Each test case should be in the following format:
{{
  "input": <a valid Python input structure suitable for the question>,
  "expected_output": <the expected output of the function>
}}

Return only a **pure JSON array**, with no explanations, no markdown (like ```), and no text before or after.

Question:
{question}
"""


    testcase_response = co.generate(
        model="command",
        prompt=testcase_prompt,
        max_tokens=200,
        temperature=0.6,
    )

    testcases_raw = testcase_response.generations[0].text.strip()

    # ✅ This block was wrongly indented earlier
    print("⚠️ RAW TESTCASES FROM COHERE:")
    print(testcases_raw)

    # Extract anything inside ```json ... ```
    match = re.search(r"```json\s*(\[.*?\])\s*```", testcases_raw, re.DOTALL)
    if match:
        clean_json = match.group(1)
    else:
        # Fallback: try to extract raw JSON-looking array
        match = re.search(r"(\[\s*{.*}.*\])", testcases_raw, re.DOTALL)
        clean_json = match.group(1) if match else "[]"

    try:
        testcases = json.loads(clean_json)
    except Exception as e:
        print(f"❌ JSON parsing failed: {e}")
        testcases = []

    # Store in memory
    question_store[user_id] = {
        "question": question,
        "testcases": testcases
    }

    # ✅ Return this to frontend
    return {
        "question": question,
        "testcases": testcases
    }
