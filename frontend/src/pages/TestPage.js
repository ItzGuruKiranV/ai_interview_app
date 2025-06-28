import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import api from "../Api";

function TestPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [codeHint, setCodeHint] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [syntaxHint, setSyntaxHint] = useState("");
  const [showSyntaxHint, setShowSyntaxHint] = useState(false);
  const [testCases, setTestCases] = useState("");



  const fetchQuestion = async () => {
  try {
    const techStack = "python";
    const res = await api.get("/get-question", {
      params: { user_id: "abc", tech_stack: techStack },
    });

    const { question, testcases } = res.data;

    setQuestion(question);      // now it's a string
    setTestCases(testcases);    // now it's an array
    setEvaluation("");
    setAnswer("");
    setShowActions(true);

  } catch (err) {
    console.error("❌ Failed to fetch question:", err);
  }
};


  const getCodeImprovementHint = async () => {
  try {
    const res = await api.post("/ask-hint", {
      user_id: "abc",
      code: answer,
    });
    setCodeHint(res.data.hint);
    setShowHint(true);
  } catch (err) {
    console.error("❌ Hint fetch failed:", err);
    setCodeHint("Failed to fetch hint.");
  }
};



  const evaluate = async () => {
    try {
      const res = await api.post("/evaluate-answer", {
        user_id : 'abc',
        code : answer,
      });
      setEvaluation(res.data.review);
    } catch (err) {
      console.error("Evaluation failed:", err);
    }
  };

  const getSyntaxHint = async () => {
    try {
      const res = await api.post("/code-hint", {
        user_id: "abc",
        code: answer,
      });
      setSyntaxHint(res.data.hint);
      setShowSyntaxHint(true);
    } catch (err) {
      console.error("❌ Syntax hint fetch failed:", err);
      setSyntaxHint("Error getting syntax hint.");
      setShowSyntaxHint(true);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-6 text-gray-800">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
          AI-Powered Interview Test
        </h2>

        <div className="text-center mb-8">
          <button
            onClick={fetchQuestion}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Get a New Question
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {question && (
              <>
                {/* Question Card */}
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl shadow flex items-start p-6 gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                      <span className="text-2xl font-bold text-blue-600">Q</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-800 mb-1">Interview Question</h3>
                      <p className="text-gray-800 text-base">{question}</p>
                    </div>
                  </div>
                </div>

                {/* Test Cases Card */}
                <div className="mb-6">
                  <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span role="img" aria-label="test-cases"></span> Sample Test Cases
                    </h3>
                    <div className="space-y-4">
                      {testCases.map((test, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex flex-col md:flex-row md:items-center md:gap-6 shadow-sm"
                        >
                          <div className="flex items-center mb-2 md:mb-0">
                            <span className="inline-block bg-blue-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-700"></span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Input</span>
                              <code className="block bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">
                                {typeof test.input === "object"
                                  ? JSON.stringify(test.input)
                                  : test.input}
                              </code>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Expected Output</span>
                              <code className="block bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-sm">
                                {typeof test.expected_output === "object"
                                  ? JSON.stringify(test.expected_output)
                                  : test.expected_output}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="h-[400px] border border-gray-300 rounded-md shadow-sm overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={answer}
                    theme="vs-light"
                    onChange={(value) => setAnswer(value)}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      tabSize: 4,
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      acceptSuggestionOnEnter: "on",
                      tabCompletion: "on",
                    }}
                  />
                </div>

                {showActions && (
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="flex gap-4">
                      <button
                        onClick={evaluate}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                      >
                        Submit
                      </button>

                      <button
                        onClick={getSyntaxHint}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                      >
                        Get Syntax Hint
                      </button>
                    </div>

                    {showSyntaxHint && (
                      <div className="bg-indigo-50 border border-indigo-300 p-3 rounded-md text-sm text-gray-800">
                        <strong>Syntax Hint:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-indigo-800">{syntaxHint}</pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {question && (
            <div>
              <div className="border p-4 rounded-md bg-gray-50 shadow-sm">
                <h3 className="text-md font-semibold mb-2 text-gray-800">💡 Need a Hint?</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Click the button below to get suggestions on how to improve your code.
                </p>
                
                <button
                  onClick={getCodeImprovementHint}
                  className="mt-3 w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                >
                  Code Improvement Hint
                </button>

                {showHint && (
                  <div className="mt-4 bg-yellow-100 border border-yellow-300 p-3 rounded-md text-sm text-gray-700">
                    <strong>Hint:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{codeHint}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {evaluation && (
          <div className="mt-8 bg-gray-100 p-4 rounded-md border border-gray-300">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Evaluation Result</h3>
            <pre className="whitespace-pre-wrap text-gray-700">{evaluation}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestPage;
