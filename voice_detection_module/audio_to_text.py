import whisper


def transcribe_audio(audio_path):
    try:
        # print("🧠 Loading Whisper model...")
        model = whisper.load_model("tiny")  # You can use 'tiny', 'base', 'small', 'medium', or 'large'

        # print("🗣️ Transcribing audio...")
        result = model.transcribe(audio_path , language = 'en')

        # print("📝 Transcription complete:")
        print("The text you have spoke:: " , result["text"])

        return result["text"]

    except Exception as e:
        print(f"❌ Error in transcription: {e}")
        return None
    
