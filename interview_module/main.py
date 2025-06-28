import time
from interview_question_generatr import generate_next_question
from speech_to_text import listen
from text_to_specch import speak
from evaluator import evaluate_answer

def start_interactive_interview():
    chat_history = []

    speak("Welcome to your interactive AI interview. Let's begin.")
    question = "Tell me about yourself."


    for i in range(5):
        
        print("🧠 AI:", question)
        speak(question)
        answer = listen()
        print("🗣️ You answered:", answer)
        chat_history.append((question, answer))

        question = generate_next_question(chat_history)
        time.sleep(1)
    result = evaluate_answer(chat_history)
    print(result)
    print("Thank you")

if __name__ == "__main__":
    start_interactive_interview()
