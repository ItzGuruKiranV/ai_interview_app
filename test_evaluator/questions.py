import os
import cohere
from dotenv import load_dotenv
from pathlib import Path
import re
import json

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

# In-memory question store keyed by user_id
question_store = {}


def generate_question_and_testcases(user_id: str, tech_stack: str):
    """Generate a coding question with sample and hidden test cases using Cohere AI."""

    prompt = f"""Create a coding problem for a {tech_stack} interview.

Respond strictly in the following format:

---
🧠 Coding Question
<your coding question>

📥 Input Format:
<Describe how the user inputs data. Use 'Enter the ...::' style prompts>

📤 Output Format:
<Describe what will be printed by the code>

🔍 Examples:

Input:
Enter the string:: hello world
Enter the word:: world

Output:
True

Input:
Enter the string:: python rocks
Enter the word:: java

Output:
False
---

Do NOT explain anything. Do NOT add any extra newlines. Just follow the exact format above.
"""

    try:
        response = co.generate(
            model="command",
            prompt=prompt,
            max_tokens=600,
            temperature=0.5,
        )

        raw = response.generations[0].text.strip()

        # Extract question block
        question_block_match = re.search(r"🧠 Coding Question(.*)", raw, re.DOTALL)
        question = "🧠 Coding Question" + question_block_match.group(1).strip() if question_block_match else raw

        # Extract sample test cases from examples section
        examples = re.findall(r"Input:\s*(.*?)\s*Output:\s*(.*?)(?:\n|$)", raw, re.DOTALL)
        sample_testcases = [
            {
                "input": input_block.strip(),
                "expected_output": output_block.strip()
            }
            for input_block, output_block in examples
        ]

        # --- Generate hidden test cases ---
        hidden_prompt = f"""You are given this coding question:

{question}

Generate exactly 6 hidden test cases in this JSON array format ONLY. Do not explain. Do not write anything outside the array.

[
  {{"input": "Enter the string:: hello\\nEnter the word:: world", "expected_output": "True"}},
  ...
]
"""

        hidden_cases = []
        attempts = 0
        while not hidden_cases and attempts < 3:
            hidden_response = co.generate(
                model="command",
                prompt=hidden_prompt,
                max_tokens=400,
                temperature=0.4,
            )

            hidden_text = hidden_response.generations[0].text.strip()

            try:
                json_start = hidden_text.find('[')
                json_end = hidden_text.rfind(']')
                if json_start != -1 and json_end != -1:
                    hidden_text_cleaned = hidden_text[json_start:json_end + 1]
                    parsed = json.loads(hidden_text_cleaned)
                    if isinstance(parsed, list) and all(
                        "input" in t and "expected_output" in t for t in parsed
                    ):
                        hidden_cases = parsed
                    else:
                        raise ValueError("Invalid structure inside array")
                else:
                    raise ValueError("JSON array not found in response")
            except Exception as e:
                print(f"❌ Hidden test case parsing failed on attempt {attempts + 1}: {e}")
                hidden_cases = []
                attempts += 1

        if not hidden_cases:
            print("⚠️ Warning: No hidden test cases parsed successfully.")

        # Save everything to in-memory store
        question_store[user_id] = {
            "question": question,
            "sample_cases": sample_testcases,
            "hidden_testcases": hidden_cases
        }

        print(f"✅ Stored question for user_id: {user_id}")
        return {
            "question": question,
            "sample_testcases": sample_testcases
        }

    except Exception as e:
        print("❌ Failed to generate question or testcases:", e)
        return {
            "question": "",
            "sample_testcases": []
        }


def get_hidden_testcases(user_id: str):
    print("🔎 Fetching hidden test cases for:", user_id)
    print("🧠 Available keys in memory:", list(question_store.keys()))

    test_data = question_store.get(user_id)
    if not test_data:
        print("❌ No question data found in store.")
        return []

    hidden = test_data.get("hidden_testcases")
    if not hidden:
        print("❌ No hidden testcases found.")
        return []

    return hidden
