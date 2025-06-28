import cohere
import os 
from dotenv import load_dotenv

load_dotenv()
co =co = cohere.Client(os.getenv("COHERE_API_KEY"))



def evaluate_answer(interaction_list):
    formatted = "\n".join([f"AI: {q}\nUser: {a}" for q, a in interaction_list])

    prompt = f"""
You are an interview coach. Evaluate the following conversation briefly:

"This was the list of interaction between me and interviewer and all the elements are in the form (question, answer)":{interaction_list}
Score the canddate from one to ten.
Give helpful feedback in only 1 line what he made mistake.
"""
    res = co.generate(model="command", prompt=prompt, max_tokens=120)
    return res.generations[0].text.strip()
