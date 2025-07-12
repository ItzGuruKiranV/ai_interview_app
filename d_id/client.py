# d_id/client.py
import requests
import os

class DId:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_base = "https://api.d-id.com/talks"

    def text_to_video(self, speaker="en-US-JennyNeural", script="Hi"):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "script": {
                "type": "text",
                "input": script,
                "provider": {
                    "type": "microsoft",
                    "voice_id": speaker
                }
            },
            "config": {
                "fluent": True,
                "pad_audio": 0.1
            },
            "source_url": "https://create-images-results.d-id.com/DefaultPresenters/belle-square.jpg"
        }

        res = requests.post(self.api_base, headers=headers, json=payload)
        if res.status_code == 201:
            talk_id = res.json()["id"]
            return {
                "video_url": f"https://studio.d-id.com/talks/{talk_id}"
            }
        else:
            raise Exception(f"D-ID error: {res.status_code} | {res.text}")
