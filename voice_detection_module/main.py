from extract_audio import extract_audio_from_video
from audio_to_text import transcribe_audio
from evaluate import evaluate_answer

import warnings
warnings.filterwarnings("ignore")  # This suppresses whisper's warning
def video_to_audio():
    while True:
        video_path = input("Enter the path of the video file (.mp4):: ").strip()

        if video_path.endswith('.mp4') or video_path.endswith('.webm'):
            return video_path
        

        else:
             print("❌ Invalid file. Please enter a valid video file path (.mp4 or .webm).")

video_path = video_to_audio()
print('\n')
audio_path = extract_audio_from_video(video_path)
input_text = transcribe_audio(audio_path)

Question = "What is machine learning??"
result = evaluate_answer(Question , input_text)
print(result)
print('\n')
