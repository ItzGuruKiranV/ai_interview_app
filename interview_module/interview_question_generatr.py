import cohere
import os
from dotenv import load_dotenv

load_dotenv()
co = cohere.Client(os.getenv("COHERE_API_KEY"))

def generate_next_question(chat_history):
    formatted = "\n".join([f"AI: {q}\nUser: {a}" for q, a in chat_history])

    prompt = f"""
You are an AI technical interviewer. Your role is to only ask one **interview question** at a time, based on the candidate's answers.

🛑 Never suggest, describe, explain, or assist.
✅ Only ask crisp, relevant interview questions.
🚫 No greetings, compliments, or motivational comments.
🎯 Focus on technical or behavioral software interview questions.

Interview so far:
{formatted}
AI:"""

    res = co.generate(model="command", prompt=prompt, max_tokens=60)
    return res.generations[0].text.strip()
