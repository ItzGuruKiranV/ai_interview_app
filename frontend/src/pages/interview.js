import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import { useUser } from "@clerk/clerk-react";
import api from "../Api";

const TECH_STACKS = [
  "Data Structures and Algorithms",
  "System Design",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "Machine Learning",
  "SQL & Databases",
  "Operating Systems",
  "Computer Networks",
];

export default function InterviewPage() {
  const { user } = useUser();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedStack, setSelectedStack] = useState(TECH_STACKS[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const webcamRef = useRef(null);
  const chatHistoryRef = useRef([]);

  const handleStart = async () => {
    setStarted(true);
    chatHistoryRef.current = [];
    setRound(1);
    setFeedback("");
    setTranscript("");
    setDone(false);
    await fetchQuestion();
  };

  const fetchQuestion = async () => {
    try {
      setTyping(true);
      setLoading(true);

      const res = await api.post("/interview-question", {
        chat_history: chatHistoryRef.current,
        tech_stack: selectedStack,
      });

      const q = res.data.next_question;
      setQuestion(q);
      setLoading(false);
      setTyping(false);

      // Speak the question
      await speak(q);
      // Start listening for answer
      startListening(q);
    } catch (err) {
      console.error("❌ Error fetching question:", err);
      setTyping(false);
      setLoading(false);
    }
  };

  const speak = (text) =>
    new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });

  const startListening = (currentQuestion) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecording(true);

    const timeout = setTimeout(() => recognition.stop(), 20000); // 20s limit

    recognition.onresult = async (e) => {
      clearTimeout(timeout);
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setRecording(false);

      chatHistoryRef.current.push({ question: currentQuestion, answer: text });

      if (round < totalRounds) {
        setRound((r) => r + 1);
        await fetchQuestion();
      } else {
        // Evaluate
        setLoading(true);
        try {
          const evalRes = await api.post("/interview-evaluate", {
            chat_history: chatHistoryRef.current,
            tech_stack: selectedStack,
          });
          setFeedback(evalRes.data.feedback);

          // Save history
          const email = user?.primaryEmailAddress?.emailAddress;
          if (email) {
            api.post("/save-history", {
              email,
              session_type: "interview",
              tech_stack: selectedStack,
              feedback: evalRes.data.feedback,
            }).catch(() => {});
          }
        } catch (err) {
          setFeedback("Could not evaluate interview. Please try again.");
        } finally {
          setLoading(false);
          setDone(true);
        }
      }
    };

    recognition.onerror = (e) => {
      clearTimeout(timeout);
      console.error("Speech error:", e.error);
      setTranscript("❌ Could not understand. Please speak clearly.");
      setRecording(false);
    };

    recognition.start();
  };

  const progressPct = ((round - 1) / totalRounds) * 100;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-700 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-violet-700 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">🎙️ AI Mock Interview</h1>
            <p className="text-blue-300 text-sm mt-1">Powered by Cohere AI · Speech Recognition</p>
          </div>
          {started && !done && (
            <div className="text-right">
              <div className="text-blue-300 text-sm mb-1">
                Question {round} of {totalRounds}
              </div>
              <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pre-start Screen */}
        {!started ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-10 text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-white mb-3">Ready for Your Mock Interview?</h2>
            <p className="text-blue-300 mb-8 max-w-md mx-auto">
              Choose your tech stack, then click Start. The AI will ask you {totalRounds} questions and evaluate your answers.
            </p>

            {/* Tech Stack Selector */}
            <div className="mb-8">
              <label className="block text-blue-300 text-sm font-semibold mb-2">
                Select Tech Stack
              </label>
              <select
                id="tech-stack-select"
                value={selectedStack}
                onChange={(e) => setSelectedStack(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 w-full max-w-sm text-sm focus:outline-none focus:border-blue-500"
              >
                {TECH_STACKS.map((stack) => (
                  <option key={stack} value={stack} className="bg-[#050b1a]">
                    {stack}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="start-interview-btn"
              onClick={handleStart}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-blue-900/40 transition-all hover:scale-105"
            >
              🚀 Start Interview
            </button>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
              {[["🎤", "Speak your answer"], ["⏱️", "20s per answer"], ["📊", "AI scored feedback"]].map(
                ([icon, label], i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-blue-300">{label}</div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : done && feedback ? (
          /* Feedback Screen */
          <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-10">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏁</div>
              <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
              <p className="text-blue-300 text-sm mt-1">Here's your AI-generated feedback</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/40 to-violet-900/30 border border-blue-500/30 rounded-xl p-6 mb-6">
              <p className="text-blue-100 text-base leading-relaxed whitespace-pre-wrap">{feedback}</p>
            </div>
            <div className="flex gap-3">
              <button
                id="restart-interview-btn"
                onClick={() => { setStarted(false); setDone(false); }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition"
              >
                🔄 Try Again
              </button>
              <button
                id="go-history-btn"
                onClick={() => window.location.href = "/history"}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition"
              >
                📜 View History
              </button>
            </div>
          </div>
        ) : (
          /* Interview in Progress */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Question + Webcam */}
            <div className="space-y-4">
              {/* Question card */}
              <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Q{round}
                  </span>
                  {recording && (
                    <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold animate-pulse">
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                      Listening...
                    </span>
                  )}
                </div>
                <div className="min-h-[80px]">
                  {typing || loading ? (
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  ) : (
                    <p className="text-white text-base leading-relaxed">{question}</p>
                  )}
                </div>
              </div>

              {/* Webcam */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden aspect-video">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="w-full h-full object-cover"
                  mirrored
                />
              </div>
            </div>

            {/* Right: Answer + Controls */}
            <div className="space-y-4">
              {/* Answer transcript */}
              <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 flex flex-col min-h-[160px]">
                <h3 className="text-blue-300 text-sm font-semibold mb-3">🗣️ Your Answer</h3>
                <div className="flex-1 bg-white/5 rounded-xl p-4 text-white text-sm leading-relaxed">
                  {transcript ? (
                    <p>{transcript}</p>
                  ) : recording ? (
                    <span className="text-blue-400 animate-pulse">🎤 Listening... speak now</span>
                  ) : (
                    <span className="text-white/30">Awaiting your answer...</span>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Structure your answers with examples</li>
                  <li>• It's okay to take a moment to think</li>
                  <li>• Your answer window is 20 seconds</li>
                </ul>
              </div>

              {/* Chat history */}
              {chatHistoryRef.current.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-h-48 overflow-auto">
                  <h3 className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">📋 Chat Log</h3>
                  <div className="space-y-3">
                    {chatHistoryRef.current.map((item, i) => (
                      <div key={i} className="text-xs">
                        <div className="text-blue-400 font-semibold">Q{i + 1}: {item.question}</div>
                        <div className="text-white/70 mt-0.5">A: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
