import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import ReactPlayer from "react-player";
import api from "../Api";

export default function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState("");
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [typing, setTyping] = useState(false);

  const webcamRef = useRef(null);
  const chatHistoryRef = useRef([]);
  const techStack = "Data Structures and Algorithms";

  const handleStart = async () => {
    setStarted(true);
    chatHistoryRef.current = [];
    setRound(1);
    await fetchQuestion();
  };

  const fetchQuestion = async () => {
    try {
      setTyping(true);

      // Step 1: Get interview question
      const res = await api.post("/interview-question", {
        chat_history: chatHistoryRef.current,
        tech_stack: techStack,
      });

      const q = res.data.next_question;
      setQuestion(q);
      setTyping(false);

      // Step 2: Get avatar video from backend
      const avatarRes = await api.post("/did-avatar", { text: q });

      if (avatarRes.data.video_url) {
        setAvatarVideoUrl(avatarRes.data.video_url);
      } else {
        setAvatarVideoUrl("");
        console.warn("No video URL received from avatar API.");
      }

      // Step 3: Use browser speech to speak question
      await speak(q);

      // Step 4: Begin speech recognition
      startListening(q);
    } catch (err) {
      console.error("❌ Error fetching question or avatar:", err);
      setTyping(false);
    }
  };

  const speak = (text) =>
    new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.onend = resolve;
      window.speechSynthesis.speak(utterance);
    });

  const startListening = (currentQuestion) => {
    const recognition =
      new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setRecording(true);

    const timeout = setTimeout(() => recognition.stop(), 15000); // 15s limit

    recognition.onresult = async (e) => {
      clearTimeout(timeout);
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setRecording(false);

      chatHistoryRef.current.push({ question: currentQuestion, answer: text });

      if (round < 5) {
        setRound((r) => r + 1);
        await fetchQuestion();
      } else {
        const evalRes = await api.post("/interview-evaluate", {
          chat_history: chatHistoryRef.current,
          tech_stack: techStack,
        });
        setFeedback(evalRes.data.feedback);
      }
    };

    recognition.onerror = () => {
      clearTimeout(timeout);
      setTranscript("❌ Could not understand.");
      setRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 border border-blue-200">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-blue-900">
            🎙️ Mock Interview {started ? `— Question ${round}/5` : ""}
          </h1>
          {recording && (
            <span className="text-red-600 text-sm animate-pulse">
              🎧 Listening...
            </span>
          )}
        </div>

        {/* Start Button */}
        {!started ? (
          <div className="text-center py-20">
            <button
              onClick={handleStart}
              className="bg-blue-700 text-white px-12 py-4 text-xl rounded-full hover:bg-blue-800 transition shadow-lg"
            >
              🚀 Start Interview
            </button>
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="rounded-xl overflow-hidden border shadow-md">
                {avatarVideoUrl ? (
                  <ReactPlayer
                    url={avatarVideoUrl}
                    playing
                    controls={false}
                    loop={false}
                    width="320px"
                    height="auto"
                  />
                ) : (
                  <div className="w-80 h-48 bg-blue-100 flex items-center justify-center text-blue-500 text-xl">
                    🎬 Loading AI...
                  </div>
                )}
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="bg-gray-50 border border-blue-100 rounded-lg p-4 text-lg font-medium text-gray-800 shadow-inner">
                {typing ? "✍️ Typing..." : question}
              </div>
            </div>

            {/* Webcam & Transcript */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg overflow-hidden shadow-md">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="w-full aspect-video object-cover"
                />
              </div>
              <div className="bg-gray-100 border rounded-lg shadow p-4 flex flex-col">
                <h2 className="text-gray-700 font-semibold mb-2">
                  🗣️ Your Answer:
                </h2>
                <div className="bg-white p-3 rounded border text-gray-800 min-h-[100px] text-base">
                  {transcript || (recording ? "🎤 Listening..." : "Awaiting...")}
                </div>
              </div>
            </div>

            {/* Final Feedback */}
            {feedback && (
              <div className="mt-6 bg-green-50 border border-green-300 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  ✅ Final Feedback
                </h2>
                <p className="text-green-700 text-base">{feedback}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
