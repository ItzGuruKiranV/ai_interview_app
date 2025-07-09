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
    prompt = f"""
You are an expert interviewer creating a coding question for a {tech_stack} interview.

⚠️ You MUST return ONLY this format. DO NOT explain anything. DO NOT add any commentary:

---
🧠 Coding Question
Your question here.

📥 Input Format:
Explain how input is taken like: Enter the string:: ...

📤 Output Format:
What should be printed.

🔍 Examples:

Input:
Enter the string:: abac
Enter the char:: a

Output:
2
---
[
  {{"input": "Enter the string:: abac\\nEnter the char:: a", "expected_output": "2"}},
  {{"input": "Enter the string:: aaabbaaa\\nEnter the char:: a", "expected_output": "2"}},
  {{"input": "Enter the string:: xyz\\nEnter the char:: z", "expected_output": "1"}},
  {{"input": "Enter the string:: \\nEnter the char:: a", "expected_output": "0"}},
  {{"input": "Enter the string:: aabbcc\\nEnter the char:: b", "expected_output": "1"}},
  {{"input": "Enter the string:: aaabbbccc\\nEnter the char:: b", "expected_output": "1"}},
  {{"input": "Enter the string:: abcabcabc\\nEnter the char:: c", "expected_output": "3"}},
  {{"input": "Enter the string:: aaabbaaa\\nEnter the char:: b", "expected_output": "1"}}
]
"""

    try:
        response = co.generate(
            model="command",
            prompt=prompt,
            max_tokens=1000,
            temperature=0.6,
        )

        raw = response.generations[0].text.strip()
        print("🧠 Full AI Response:\n", raw)

        # Attempt to extract both parts: question and hidden testcases
        split_parts = raw.split('---')

        if len(split_parts) < 3:
            raise ValueError("❌ Response format invalid: missing --- separators.")

        question_block = split_parts[1].strip()
        hidden_text = split_parts[2].strip()

        # Extract sample testcases
        examples = re.findall(r"Input:\s*(.*?)\s*Output:\s*(.*?)(?:\n|$)", question_block, re.DOTALL)
        sample_testcases = [
            {"input": i.strip(), "expected_output": o.strip()}
            for i, o in examples
        ]

        # Extract JSON
        json_start = hidden_text.find('[')
        json_end = hidden_text.rfind(']')
        if json_start == -1 or json_end == -1:
            raise ValueError("❌ Hidden test case JSON block not found.")

        hidden_cases = json.loads(hidden_text[json_start:json_end+1])

        if not isinstance(hidden_cases, list):
            raise ValueError("❌ Hidden test case format invalid.")

        # Save everything
        question_store[user_id] = {
            "question": question_block,
            "sample_cases": sample_testcases,
            "hidden_testcases": hidden_cases
        }

        return {
            "question": question_block,
            "sample_testcases": sample_testcases
        }

    except Exception as e:
        print("❌ Final Error:", e)
        return {
            "question": "",
            "sample_testcases": []
        }

def get_hidden_testcases(user_id: str):
    data = question_store.get(user_id)
    if not data:
        print("❌ No question found for user.")
        return []

    return data.get("hidden_testcases", [])
import os
import cohere
from dotenv import load_dotenv
import re
import json

load_dotenv()
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

# Memory store
question_store = {}

def generate_question_and_testcases(user_id: str, tech_stack: str):
    prompt = f"""
Create a coding problem for a {tech_stack} interview.

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
        print("🧠 Raw AI Response:\n", raw)

        # Extract question
        question_block_match = re.search(r"🧠 Coding Question(.*)", raw, re.DOTALL)
        question = "🧠 Coding Question" + question_block_match.group(1).strip() if question_block_match else ""

        # Extract sample test cases
        examples = re.findall(r"Input:\s*(.*?)\s*Output:\s*(.*?)(?:\n|$)", raw, re.DOTALL)
        sample_testcases = [
            {
                "input": input_block.strip(),
                "expected_output": output_block.strip()
            }
            for input_block, output_block in examples
        ]

        # --- STEP 2: Generate hidden test cases ---
        hidden_prompt = f"""
You are given this coding question:

{question}

Generate exactly 8 hidden test cases in this JSON array format ONLY. Do not explain. Do not write anything outside the array.

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
                temperature=0.5,
            )

            hidden_text = hidden_response.generations[0].text.strip()
            print(f"🔍 Hidden raw response (attempt {attempts+1}):\n", hidden_text)

            try:
                # Extract valid JSON list if wrapped in explanation
                json_start = hidden_text.find('[')
                json_end = hidden_text.rfind(']')
                if json_start != -1 and json_end != -1:
                    hidden_text_cleaned = hidden_text[json_start:json_end+1]
                    parsed = json.loads(hidden_text_cleaned)
                    if isinstance(parsed, list) and all("input" in t and "expected_output" in t for t in parsed):
                        hidden_cases = parsed
                    else:
                        raise ValueError("Invalid structure inside array")
                else:
                    raise ValueError("JSON array not found in response")
            except Exception as e:
                print(f"❌ Hidden test case parsing failed on attempt {attempts+1}: {e}")
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
