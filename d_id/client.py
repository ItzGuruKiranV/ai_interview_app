# d_id/client.py
import requests
import time
import os


class DId:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_base = "https://api.d-id.com/talks"

    def text_to_video(self, script: str, speaker: str = "en-US-JennyNeural") -> dict:
        """
        Submit a text-to-video request to D-ID API.
        Returns dict with 'id' for polling, or raises Exception on failure.
        """
        if not self.api_key:
            raise Exception("D-ID API key is not configured.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "script": {
                "type": "text",
                "input": script,
                "provider": {
                    "type": "microsoft",
                    "voice_id": speaker,
                },
            },
            "config": {
                "fluent": True,
                "pad_audio": 0.1,
            },
            "source_url": "https://create-images-results.d-id.com/DefaultPresenters/belle-square.jpg",
        }

        res = requests.post(self.api_base, headers=headers, json=payload, timeout=15)
        if res.status_code in (200, 201):
            return res.json()  # Contains 'id'
        else:
            raise Exception(f"D-ID API error: {res.status_code} | {res.text}")

    def get_video_status(self, video_id: str) -> dict:
        """
        Poll for video status by talk ID.
        Returns dict with 'status' and optionally 'result_url'.
        """
        if not self.api_key:
            raise Exception("D-ID API key is not configured.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        res = requests.get(f"{self.api_base}/{video_id}", headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return {
                "status": data.get("status", "unknown"),
                "result_url": data.get("result_url", ""),
            }
        else:
            raise Exception(f"D-ID status error: {res.status_code} | {res.text}")
