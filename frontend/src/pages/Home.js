import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Welcome to AI Interview Portal</h2>
      <p>Choose what you'd like to do:</p>

      <button
        onClick={() => navigate("/resume-upload")}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        Upload Resume
      </button>

      <button
        onClick={() => navigate("/test")}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        Start Test
      </button>
    </div>
  );
}

export default Home;
