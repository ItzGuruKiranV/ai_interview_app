import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import api from "../Api";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF resume first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setScore(null);

    try {
      const res = await api.post("/resume-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data.resume_score || res.data.error;
      setScore(result);

      // Save to history
      const email = user?.primaryEmailAddress?.emailAddress;
      if (email && res.data.resume_score) {
        api.post("/save-history", {
          email,
          session_type: "resume",
          score: res.data.resume_score,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setScore("Error uploading resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Please drop a PDF file.");
    }
  };

  const getScoreColor = (scoreStr) => {
    if (!scoreStr || scoreStr.toLowerCase().includes("error")) return "text-red-400";
    const num = parseFloat(scoreStr);
    if (num >= 70) return "text-green-400";
    if (num >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (scoreStr) => {
    if (!scoreStr) return "";
    const num = parseFloat(scoreStr);
    if (num >= 80) return "🏆 Excellent Resume!";
    if (num >= 60) return "✅ Good Resume";
    if (num >= 40) return "⚠️ Needs Improvement";
    return "❌ Weak Resume";
  };

  return (
    <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-700 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-violet-700 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl text-3xl mb-4 shadow-lg shadow-blue-900/40">
            📄
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Resume Analyzer</h1>
          <p className="text-blue-300 text-sm">
            Upload your PDF resume and get an AI-powered score instantly
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          {/* Drag & Drop Zone */}
          <div
            id="resume-dropzone"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("resume-file-input").click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-blue-400 bg-blue-900/20"
                : "border-white/20 hover:border-blue-500/50 hover:bg-white/5"
            }`}
          >
            <div className="text-4xl mb-3">{file ? "📎" : "☁️"}</div>
            {file ? (
              <div>
                <p className="text-white font-semibold truncate">{file.name}</p>
                <p className="text-blue-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · PDF</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-medium mb-1">Drag & drop your PDF here</p>
                <p className="text-blue-400 text-sm">or click to browse</p>
              </div>
            )}
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* Upload Button */}
          <button
            id="resume-upload-btn"
            onClick={handleUpload}
            disabled={loading || !file}
            className={`mt-6 w-full font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || !file
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.02]"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing Resume...
              </>
            ) : (
              "🔍 Analyze Resume"
            )}
          </button>

          {/* Score Result */}
          {score !== null && (
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6 text-center animate-fade-in">
              {score.toString().toLowerCase().includes("error") ? (
                <div className="text-red-400 font-semibold">{score}</div>
              ) : (
                <>
                  <div className="text-5xl font-black mb-1 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    {score}
                  </div>
                  <div className={`font-semibold mt-1 ${getScoreColor(score)}`}>
                    {getScoreLabel(score)}
                  </div>
                  <p className="text-blue-300 text-xs mt-3">
                    Based on education, skills, experience, projects & certifications
                  </p>
                </>
              )}
            </div>
          )}

          {/* CTA after score */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              id="proceed-to-test-btn"
              onClick={() => navigate("/test")}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02]"
            >
              💻 Proceed to Coding Test →
            </button>
            <button
              id="proceed-to-interview-btn"
              onClick={() => navigate("/interview-old")}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold py-3 rounded-xl transition-all"
            >
              🎙️ Go to Mock Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeUpload;