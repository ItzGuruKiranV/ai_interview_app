import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api";


function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleUpload = async () => {
  if (!file) {
    alert("Please upload a file!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  setLoading(true);

  try {
    const res = await api.post("/resume-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    setScore(res.data.resume_score || res.data.error);
  } catch (err) {
    console.error("Upload failed:", err);
    setScore("Error uploading resume.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="bg-white/90 p-10 rounded-2xl shadow-2xl w-full max-w-lg border border-blue-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-extrabold shadow-lg mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11V17M12 7V7.01M5 12a7 7 0 1114 0 7 7 0 01-14 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-800 mb-1">Resume Uploader</h2>
          <p className="text-gray-500 text-center text-sm">Upload your PDF resume for instant feedback and scoring.</p>
        </div>

        {/* File Input */}
        <label
          htmlFor="file_input"
          className="block mb-2 text-sm font-semibold text-blue-900"
        >
          Select your PDF resume
        </label>
        <input
          className="block w-full text-sm text-gray-900 border border-blue-200 rounded-lg cursor-pointer bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          id="file_input"
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {/* File Name Preview */}
        {file && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
            Selected: {file.name}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          )}
          {loading ? "Uploading..." : "Submit"}
        </button>

        {/* Score Message */}
        {score && (
          <div className="mt-6 text-center">
            <span className="inline-block bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-lg shadow">
              {typeof score === "string" && score.toLowerCase().includes("error")
                ? score
                : `Resume Score: ${score}`}
            </span>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={() => navigate("/test")}
          className="mt-8 w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg shadow transition"
        >
          Proceed to Interview Test
        </button>
      </div>
    </div>
  );
}

export default ResumeUpload;