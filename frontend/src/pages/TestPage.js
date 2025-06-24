import React, { useState } from "react";

function TestPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");

  const fetchQuestion = async () => {
    const res = await fetch("http://127.0.0.1:8000/get-questions");
    const data = await res.json();
    setQuestion(data["Question ::"]);
    setEvaluation("");
    setAnswer("");
  };

  const evaluate = async () => {
    const res = await fetch("http://127.0.0.1:8000/evaluate-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, answer }),
    });

    const data = await res.json();
    setEvaluation(data.evaluation);
  };

  return (
    <div>
      <h2>Test Evaluation</h2>
      <button onClick={fetchQuestion}>Get Question</button>

      {question && (
        <>
          <p><strong>Question:</strong> {question}</p>
          <textarea
            rows="10"
            cols="50"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          ></textarea>
          <br />
          <button onClick={evaluate}>Submit Answer</button>
        </>
      )}

      {evaluation && (
        <div style={{ marginTop: 20 }}>
          <strong>Evaluation:</strong>
          <pre>{evaluation}</pre>
        </div>
      )}
    </div>
  );
}

export default TestPage;
