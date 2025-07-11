import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import api from "../Api";

export default function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [recording, setRecording] = useState(false);

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Start Interview
  const handleStart = () => {
    setStarted(true);
    fetchNextQuestion([]);
  };

  // Speak helper
  const speak = (text) => new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 1; u.onend = res;
    window.speechSynthesis.speak(u);
  });

  // Fetch next question
  const fetchNextQuestion = async (history) => {
    const res = await api.post("/interview-question", { chat_history: history });
    setQuestion(res.data.next_question);
    await speak(res.data.next_question);
    recordAnswer();
  };

  // Record answer
  const recordAnswer = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("file", blob);
      const tr = await api.post("/interview-transcribe", form);
      setTranscript(tr.data.text);
    };
    mediaRecorderRef.current.start();
    setTimeout(async () => {
      mediaRecorderRef.current.stop();
      stream.getTracks().forEach(t => t.stop());
      const hist = [{ question, answer: transcript }];
      if (round < 5) {
        setRound(r => r + 1);
        fetchNextQuestion(hist);
      } else {
        const evalRes = await api.post("/interview-evaluate", { chat_history: hist });
        setFeedback(evalRes.data.feedback);
      }
    }, 7000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 bg-white shadow flex justify-between">
        <h1 className="text-xl font-bold">🎙️ AI Interview – Question {round}/5</h1>
        {started && <p className="text-red-500">{recording ? "Recording..." : ""}</p>}
      </header>

      <div className="grid lg:grid-cols-2 gap-4 p-4">
        {started ? (
          <>
            <div className="bg-gray-200 rounded p-4">
              <h2 className="font-semibold mb-2">AI asks:</h2>
              <p className="text-lg">{question}</p>
            </div>
            <div className="bg-gray-200 rounded p-4 flex flex-col items-center">
              <Webcam audio={false} ref={webcamRef}
                mirrored className="w-full rounded" />
              <textarea className="mt-2 w-full p-2"
                value={transcript} placeholder="Transcribed answer" readOnly />
            </div>
          </>
        ) : (
          <div className="col-span-2 text-center p-12">
            <button className="px-6 py-4 bg-blue-600 text-white rounded-lg"
              onClick={handleStart}>Start Interview</button>
          </div>
        )}
        {feedback && (
          <div className="col-span-2 bg-green-100 p-4 rounded">
            <h2 className="font-semibold">Final Feedback:</h2>
            <p>{feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
