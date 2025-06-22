
from moviepy.video.io.VideoFileClip import VideoFileClip

    

def extract_audio_from_video(video_path):
    try:
        # Load the video
        # print("🔄 Loading video...")
        video = VideoFileClip(video_path , audio=True )

        # Set your custom audio path
        output_audio_path = r'D:\PrectisePython\ai_interview_app\voice_detection_module\user_audio.wav'

        # Extract and save audio
        # print("🎧 Extracting audio...")
        video.audio.write_audiofile(output_audio_path, codec='pcm_s16le' , logger=None)

        # print(f"✅ Audio extracted and saved at: {output_audio_path}")
        return output_audio_path

    except Exception as e:
        print(f"❌ Error extracting audio: {e}")
        return None
