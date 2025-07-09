import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Split from "split.js";
import api from "../Api";
import { useNavigate } from "react-router-dom";
import "./testpage.css";

export default function TestPage() {
  const [language, setLanguage] = useState("python");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [syntaxHint, setSyntaxHint] = useState("");
  const [showSyntaxHint, setShowSyntaxHint] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [testEnded, setTestEnded] = useState(false);

  useEffect(() => {
    Split(["#left-panel", "#right-panel"], {
      sizes: [40, 60],
      minSize: 200,
      gutterSize: 8,
      cursor: "col-resize",
    });
  }, []);

  useEffect(() => {
    if (testEnded) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTestEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testEnded]);

  const fetchQuestion = async () => {
    const res = await api.get("/get-question", {
      params: { user_id: "abc", tech_stack: language },
    });
    setQuestion(res.data.question);
    setTestCases(res.data.testcases);
    setAnswer("");
    setEvaluation("");
    setSyntaxHint("");
    setShowSyntaxHint(false);
  };

    const handleRunTestCases = async () => {
    const res = await api.post("/run-tests", {
      user_id: "abc",
      code: answer,
    });

    const results = res.data.result;
    if (!results || results.length === 0) {
      setEvaluation("⚠️ No test cases found.");
      return;
    }

    const formatted = results.map(
      (r) =>
        `✅ Test ${r.testcase}:\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\nResult: ${
          r.passed ? "✅ Passed" : "❌ Failed"
        }\n`
    );

    setEvaluation(formatted.join("\n\n"));
  };




  const evaluate = async () => {
    const res = await api.post("/evaluate-answer", {
      user_id: "abc",
      code: answer,
    });
    setEvaluation(res.data.review);
  };

  const getSyntaxHint = async () => {
    const res = await api.post("/code-hint", {
      user_id: "abc",
      code: answer,
    });
    setSyntaxHint(res.data.hint);
    setShowSyntaxHint(true);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">
      {/* Left Panel */}
      <div
        id="left-panel"
        ref={leftRef}
        className="bg-white p-6 overflow-auto border-r border-gray-300"
      >
        <h2 className="text-xl font-bold text-blue-700 mb-4">🧠 Coding Question</h2>
        {question ? (
          <>
            <p className="whitespace-pre-line mb-4 text-gray-800">{question}</p>
            <h3 className="text-md font-semibold text-blue-600 mb-2">🧪 Sample Test Cases</h3>
            {Array.isArray(testCases) && testCases.slice(0, 2).map((tc, i) => (
              <div key={i} className="bg-blue-50 p-3 rounded mb-2 text-sm">
                <div>
                  <strong>Input:</strong>
                  <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm text-gray-800">
                    {tc.input}
                  </pre>
                </div>
                <div>
                  <strong>Expected Output:</strong>
                  <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm text-gray-800">
                    {tc.expected_output}
                  </pre>
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="text-gray-500 text-sm">Click "New Question" to start.</p>
        )}
      </div>

      {/* Right Panel */}
      <div
        id="right-panel"
        ref={rightRef}
        className="flex flex-col bg-[#1e1e2f] text-white"
      >
        <div className="flex justify-between items-center px-6 py-3 bg-[#282c34] border-b border-gray-700">
          <div className="font-bold">💻 Code Editor</div>
          <div className="flex items-center gap-3">
            <span className="text-red-400 font-semibold border border-red-500 px-2 py-1 rounded">
              ⏳ {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
              disabled={testEnded}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <button
              onClick={fetchQuestion}
              disabled={testEnded}
              className={`bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm ${
                testEnded ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              New Question
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Editor
            language={language}
            value={answer}
            onChange={(val) => setAnswer(val)}
            theme="vs-dark"
            height="100%"
            options={{
              fontSize: 14,
              wordWrap: "on",
              minimap: { enabled: false },
            }}
          />
        </div>

        <div className="flex justify-between items-center px-6 py-3 bg-[#282c34] border-t border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={handleRunTestCases}
              disabled={testEnded}
              className={`bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-1.5 rounded ${
                testEnded ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Run Tests
            </button>
            <button
              onClick={() => {
                setOnConfirmAction(() => evaluate);
                setShowConfirmModal(true);
              }}
              disabled={testEnded}
              className={`bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded ${
                testEnded ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Submit
            </button>
            <button
              onClick={getSyntaxHint}
              disabled={testEnded}
              className={`bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded ${
                testEnded ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Get Hint
            </button>
          </div>
        </div>

        {showSyntaxHint && (
          <div className="bg-[#232738] px-6 py-3 border-t border-gray-700 text-green-300 text-sm">
            <strong>💡 Hint:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{syntaxHint}</pre>
          </div>
        )}

        {evaluation && (
          <div className="bg-[#232738] px-6 py-3 border-t border-gray-700 text-blue-300 text-sm">
            <strong>📊 Evaluation:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{evaluation}</pre>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>🛑 Confirm Submit</h2>
            <p>Are you sure you want to submit this answer?</p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (onConfirmAction) onConfirmAction();
                }}
              >
                Yes
              </button>
              <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {testEnded && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>⏰ Time's Up!</h2>
            <p>Your test has ended. You can no longer submit answers.</p>
            <div className="modal-actions">
              <button onClick={() => navigate("/")}>Go to Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
