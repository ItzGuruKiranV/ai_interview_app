import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import Editor from "@monaco-editor/react";
import Split from "split.js";
import { useNavigate } from "react-router-dom";
import api from "../Api";
import "./testpage.css";
import { useUser } from "@clerk/clerk-react";

export default function TestPage() {
  const [language, setLanguage] = useState("python");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [syntaxHint, setSyntaxHint] = useState("");
  const [showSyntaxHint, setShowSyntaxHint] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [isQuestionLoading, setIsQuestionLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [testEnded, setTestEnded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const rightBottomRef = useRef(null);

  const userId = user?.id; // safe optional chaining

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      Split(["#left-panel", "#right-panel"], {
        sizes: [40, 60],
        minSize: 200,
        gutterSize: 8,
        cursor: "col-resize",
      });
    });
  }, []);

  const fetchQuestion = useCallback(async () => {
    if (!userId) return;

    setIsQuestionLoading(true);
    try {
      const res = await api.get("/get-question", {
        params: { user_id: userId, tech_stack: language },
      });
      setQuestion(res.data.question);
      setTestCases(res.data.testcases || []);
      setAnswer("");
      setEvaluation("");
      setSyntaxHint("");
      setShowSyntaxHint(false);
      setTimeLeft(60); // ⏱️ 1 minute
      setTestEnded(false);
    } catch (err) {
      console.error("Error fetching question:", err);
    } finally {
      setIsQuestionLoading(false);
    }
  }, [language, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchQuestion();
  }, [fetchQuestion, userId]);

  useEffect(() => {
    if (testEnded || isQuestionLoading || !question) return;

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
  }, [testEnded, isQuestionLoading, question]);

  const scrollToBottom = () =>
    rightBottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleRunTestCases = async () => {
    const res = await api.post("/run-tests", {
      user_id: userId,
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
    scrollToBottom();
  };

  const evaluate = async () => {
    const res = await api.post("/evaluate-answer", {
      user_id: userId,
      code: answer,
    });
    setEvaluation(res.data.review);
    scrollToBottom();
  };

  const getSyntaxHint = async () => {
    const res = await api.post("/code-hint", {
      user_id: userId,
      code: answer,
    });
    setSyntaxHint(res.data.hint);
    setShowSyntaxHint(true);
    scrollToBottom();
  };

  if (!isLoaded || !user) {
    return <div className="text-white p-6">Loading user...</div>;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans relative">
      {/* Left Panel */}
      <div
        id="left-panel"
        className="bg-white p-6 overflow-auto border-r border-gray-300"
      >
        <h2 className="text-xl font-bold text-blue-700 mb-4">🧠 Coding Question</h2>
        {isQuestionLoading ? (
          <p className="text-gray-500 text-sm animate-pulse">
            ⏳ Loading question...
          </p>
        ) : (
          <>
            <p className="whitespace-pre-line mb-4 text-gray-800">{question}</p>
            <h3 className="text-md font-semibold text-blue-600 mb-2">
              🧪 Sample Test Cases
            </h3>
            {testCases.slice(0, 2).map((tc, i) => (
              <div
                key={i}
                className="bg-blue-50 p-3 rounded mb-2 text-sm shadow"
              >
                <strong>Input:</strong>
                <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm text-gray-800">
                  {tc.input}
                </pre>
                <strong>Expected Output:</strong>
                <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm text-gray-800">
                  {tc.expected_output}
                </pre>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Right Panel */}
      <div
        id="right-panel"
        className="flex flex-col bg-[#1e1e2f] text-white overflow-hidden"
      >
        {/* Topbar */}
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
          </div>
        </div>

        {/* Editor and Output */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 min-h-[300px]">
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

          {/* Action Buttons */}
          <div className="flex justify-start gap-2 px-6 py-3 bg-[#282c34] border-t border-gray-700">
            <button
              onClick={handleRunTestCases}
              disabled={testEnded}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-1.5 rounded"
            >
              Run Tests
            </button>
            <button
              onClick={() => {
                setOnConfirmAction(() => evaluate);
                setShowConfirmModal(true);
              }}
              disabled={testEnded}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded"
            >
              Submit
            </button>
            <button
              onClick={getSyntaxHint}
              disabled={testEnded}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded"
            >
              Get Hint
            </button>
          </div>

          {/* Evaluation */}
          {evaluation && (
            <div className="relative bg-[#232738] px-6 py-3 border-t border-gray-700 text-blue-300 text-sm max-h-60 overflow-auto">
              <button
                onClick={() => setEvaluation("")}
                className="absolute top-2 right-3 text-white hover:text-red-400 text-lg font-bold"
                title="Close"
              >
                ❌
              </button>
              <strong>📊 Evaluation:</strong>
              <pre className="mt-2 whitespace-pre-wrap">{evaluation}</pre>
            </div>
          )}

          {/* Hint */}
          {showSyntaxHint && (
            <div className="relative bg-[#232738] px-6 py-3 border-t border-gray-700 text-green-300 text-sm max-h-60 overflow-auto">
              <button
                onClick={() => setShowSyntaxHint(false)}
                className="absolute top-2 right-3 text-white hover:text-red-400 text-lg font-bold"
                title="Close"
              >
                ❌
              </button>
              <strong>💡 Hint:</strong>
              <pre className="mt-2 whitespace-pre-wrap">{syntaxHint}</pre>
            </div>
          )}

          <div ref={rightBottomRef} />
        </div>

        {/* Confirm Modal */}
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
                <button onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time's up modal */}
        {testEnded && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>⏰ Time's Up!</h2>
              <p>You ran out of time... Ready for interview?</p>
              <div className="modal-actions">
                <button onClick={() => navigate("/interview-old")}>
                  Go to Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Loading */}
      {isQuestionLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}
    </div>
  );
}
