import React, { useState, useRef } from "react";
import api from "../Api";

function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const handleStart = () => {
    const initialQuestion = "Tell me about yourself.";
    setCurrentQuestion(initialQuestion);
    setStarted(true);
    speak(initialQuestion);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleRecord = async () => {
    if (recording) return;

    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "answer.webm");

      try {
        const res = await api.post("/interview-transcribe", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const transcribedText = res.data.text;
        setCurrentAnswer(transcribedText);
      } catch (err) {
        console.error("❌ Transcription failed:", err);
      }

      setRecording(false);
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    }, 5000); // record 5 seconds
  };

  const handleSubmit = async () => {
    if (chatHistory.length < 4 || currentAnswer === "") {
      alert("At least answer 5 questions before submitting.");
    } else {
      try {
        const res = await api.post("/interview-evaluate", {
          chat_history: [...chatHistory, { question: currentQuestion, answer: currentAnswer }],
        });
        setFeedback(res.data.feedback);
      } catch (err) {
        console.error("❌ Submission failed:", err);
      }
    }
  };

  const handleNext = async () => {
    if (currentAnswer.trim() === "") {
      alert("Please complete your answer before continuing.");
      return;
    }

    try {
      const updatedHistory = [
        ...chatHistory,
        { question: currentQuestion, answer: currentAnswer },
      ];

      const res = await api.post("/interview-question", {
        chat_history: updatedHistory,
      });

      const nextQ = res.data.next_question;
      setChatHistory(updatedHistory);
      setCurrentAnswer("");
      setCurrentQuestion(nextQ);
      setQuestionCount((prev) => prev + 1);
      speak(nextQ);
    } catch (err) {
      console.error("❌ Failed to fetch question:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">🎤 AI Video Interview</h1>

      {!started ? (
        <button
          onClick={handleStart}
          className="bg-blue-600 text-white px-8 py-4 rounded-full text-xl hover:bg-blue-700 transition"
        >
          Start Interview
        </button>
      ) : (
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="space-y-4">
            {chatHistory.map((item, index) => (
              <div key={index} className="border-b pb-3">
                <p className="text-blue-600 font-semibold mb-1">AI Question {index + 1}:</p>
                <p className="ml-4">{item.question}</p>
                <p className="text-green-600 font-semibold mt-2">Your Answer:</p>
                <p className="ml-4">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-blue-800 font-semibold">
              AI Question {questionCount}: {currentQuestion}
            </p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="mt-2 w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Or record your answer..."
            ></textarea>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleRecord}
                disabled={recording}
                className={`px-6 py-2 rounded ${
                  recording ? "bg-gray-500" : "bg-yellow-500 hover:bg-yellow-600"
                } text-white`}
              >
                🎙️ {recording ? "Recording..." : "Record Answer"}
              </button>

              <button
                onClick={handleNext}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Next Question
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>

            {feedback && (
              <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 text-green-800 rounded">
                <strong>Feedback:</strong> {feedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPage;
