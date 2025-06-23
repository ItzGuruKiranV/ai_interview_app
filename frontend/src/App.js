import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState("");

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
    </div>
  );
}

export default App;
