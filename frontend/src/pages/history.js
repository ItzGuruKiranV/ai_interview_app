import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import api from "../Api";

function History() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (!userEmail) return;

      try {
        setLoading(true);
        const res = await api.get(`/history?email=${userEmail}`);
        setHistory(res.data.history || []);
      } catch (err) {
        console.error("Error fetching history", err);
        setError("Could not load history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHistory();
  }, [user]);

  const sessionIcon = (type) => {
    if (type === "interview") return "🎙️";
    if (type === "coding") return "💻";
    if (type === "resume") return "📄";
    return "📋";
  };

  const sessionLabel = (type) => {
    if (type === "interview") return "Mock Interview";
    if (type === "coding") return "Coding Test";
    if (type === "resume") return "Resume Scan";
    return type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-2">📜 Session History</h1>
          <p className="text-blue-300 text-sm">Track your progress across all interview sessions</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🗒️</div>
            <h2 className="text-white text-xl font-semibold mb-2">No history yet</h2>
            <p className="text-blue-300 text-sm">
              Complete a mock interview or coding test to see your sessions here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/10 transition"
              >
                {/* Icon */}
                <div className="text-4xl">{sessionIcon(item.session_type)}</div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{sessionLabel(item.session_type)}</span>
                    {item.tech_stack && (
                      <span className="bg-blue-700/50 text-blue-200 text-xs px-2 py-0.5 rounded-full">
                        {item.tech_stack}
                      </span>
                    )}
                  </div>
                  {item.score && (
                    <div className="text-green-400 text-sm font-medium">Score: {item.score}</div>
                  )}
                  {item.feedback && (
                    <div className="text-blue-200 text-sm mt-1 line-clamp-2">{item.feedback}</div>
                  )}
                  <div className="text-white/40 text-xs mt-2">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
