import cohere
import os
from dotenv import load_dotenv

load_dotenv()
co = cohere.Client(os.getenv("COHERE_API_KEY"))

def generate_next_question(chat_history, tech_stack):
    """
    Generate a strict, realistic, high-quality technical interview question based on:
    - Past questions & answers (chat history)
    - Provided tech stack or domain
    """

    # ✅ Step 1: Format chat history cleanly
    formatted = ""
    for idx, item in enumerate(chat_history):
        try:
            q = item.get("question") if isinstance(item, dict) else item.question
            a = item.get("answer") if isinstance(item, dict) else item.answer

            q = (q or "").strip()
            a = (a or "").strip()

            if q and a:
                formatted += f"Q{idx+1} (AI): {q}\nA{idx+1} (User): {a}\n"
        except Exception as e:
            print("⚠️ Skipping malformed history entry:", item)

    # ✅ Step 2: Strong prompt
    prompt = f"""
You are a highly experienced technical interviewer.

The candidate is applying for a position requiring expertise in **{tech_stack}**.

🎯 Your goal:
Ask ONLY one serious, professional, and strictly relevant question at a time.

📌 Rules (IMPORTANT):
- ❌ NO greetings (no “Hi”, “Sure”, “Let’s begin”).
- ❌ NO summaries or compliments.
- ❌ NO explanations about why you're asking.
- ✅ Just ask the next question directly.
- ✅ Stick strictly to the tech stack.
- ✅ Ask questions that test real knowledge, logic, depth, and practical skills.
- ✅ Include code-based or system design or scenario-based if required.
- ✅ If the answer was weak earlier, go deeper on that.

🗂 Context:
Below is the chat history. You must generate the **next single interview question**.

--- Interview History ---
{formatted}
Q{len(chat_history)+1} (AI):"""

    # ✅ Step 3: Call Cohere API
    try:
        response = co.generate(
            model="command",
            prompt=prompt,
            max_tokens=100,
            temperature=0.5,
            stop_sequences=[f"A{len(chat_history)+1} (User):"]
        )

        text = response.generations[0].text.strip() if response.generations else None

        if not text or len(text) < 5:
            raise ValueError("Empty or short response")

        # Ensure it's a question
        if not text.endswith("?"):
            text += "?"

        return text

    except Exception as e:
        print("❌ Error generating question:", e)
        return "Can you explain how a hash map handles collisions internally?"
