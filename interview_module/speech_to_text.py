import sounddevice as sd
import numpy as np
import tempfile
import os
from scipy.io.wavfile import write
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu")

def listen():
    fs = 44100
    duration = 25
    print("🎤 Listening...")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
    sd.wait()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        write(f.name, fs, recording)
        temp_path = f.name

    segments, _ = model.transcribe(temp_path)
    os.unlink(temp_path)

    for segment in segments:
        return segment.text
