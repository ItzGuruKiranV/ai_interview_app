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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
          AI-Powered Interview Test
        </h2>

        <div className="text-center">
          <button
            onClick={fetchQuestion}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Get a New Question
          </button>
        </div>

        {question && (
          <div className="mt-8">
            <p className="text-lg font-medium text-gray-700 mb-2">
              <strong>Question:</strong> {question}
            </p>
            <textarea
              rows="8"
              className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>

            <button
              onClick={evaluate}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
            >
              Submit Answer
            </button>
          </div>
        )}

        {evaluation && (
          <div className="mt-8 bg-gray-100 p-4 rounded-md border border-gray-300">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              Evaluation Result
            </h3>
            <pre className="whitespace-pre-wrap text-gray-700">{evaluation}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestPage;
