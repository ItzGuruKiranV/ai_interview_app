import React, { useState } from "react";

function TestPage() {
  const [questions, setQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/get-questions");
      const data = await res.json();
      setQuestions(data.questions);
      setShowQuestions(true);
    } catch (error) {
      console.error("❌ Failed to fetch questions:", error);
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      {!showQuestions ? (
        <button onClick={fetchQuestions}>Start Test</button>
      ) : (
        <div>
          <h3>Questions</h3>
          <ul>
            {questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TestPage;
