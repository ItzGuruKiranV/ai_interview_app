import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState("");
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/resume-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setScore(data.resume_score || data.error);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Upload Resume PDF</h2>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Submit</button>
      <p style={{ marginTop: 20 }}>Score: {score}</p>

      <button onClick={() => navigate("/test")} style={{ marginTop: 20 }}>
        Start Test
      </button>
    </div>
  );
}

export default ResumeUpload;
