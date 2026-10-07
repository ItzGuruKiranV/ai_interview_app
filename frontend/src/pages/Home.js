import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { ArrowRight, Braces, Clock3, FileText, Mic2, Sparkles } from "lucide-react";
import api from "../Api";

const practiceOptions = [
  {
    title: "Review your resume",
    description: "Get a section-by-section score from a PDF.",
    icon: FileText,
    path: "/resume-upload",
    label: "Resume",
  },
  {
    title: "Solve a coding prompt",
    description: "Work through a Python interview challenge.",
    icon: Braces,
    path: "/test",
    label: "Coding",
  },
  {
    title: "Practice out loud",
    description: "Run a technical mock interview with feedback.",
    icon: Mic2,
    path: "/interview-old",
    label: "Interview",
  },
];

const sessionLabels = {
  interview: "Mock interview",
  coding: "Coding practice",
  resume: "Resume review",
};

function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!email) {
      setHistoryLoading(false);
      return;
    }

    api.post("/register", { email }).catch(() => {});
    api.get("/history", { params: { email } })
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [email]);

  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <header className="dashboard-heading">
          <div>
            <p className="dashboard-eyebrow">PRACTICE WORKSPACE</p>
            <h1>Pick up where you left off{user?.firstName ? `, ${user.firstName}` : ""}.</h1>
            <p className="dashboard-subtitle">Choose a focused session. Your recent work is kept below.</p>
          </div>
          <div className="dashboard-session-count">
            <Sparkles size={17} aria-hidden="true" />
            <span>{history.length} saved {history.length === 1 ? "session" : "sessions"}</span>
          </div>
        </header>

        <section className="dashboard-practice" aria-labelledby="practice-title">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">THREE WAYS TO PRACTICE</p>
              <h2 id="practice-title">Start a session</h2>
            </div>
          </div>
          <div className="practice-grid">
            {practiceOptions.map(({ title, description, icon: Icon, path, label }) => (
              <button
                className="practice-option"
                key={path}
                onClick={() => navigate(path)}
                aria-label={`${label}: ${title}`}
              >
                <span className="practice-icon"><Icon size={20} aria-hidden="true" /></span>
                <span className="practice-copy">
                  <span className="practice-label">{label}</span>
                  <span className="practice-title">{title}</span>
                  <span className="practice-description">{description}</span>
                </span>
                <ArrowRight className="practice-arrow" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-history" aria-labelledby="history-title">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR ACTIVITY</p>
              <h2 id="history-title">Recent sessions</h2>
            </div>
            <button className="dashboard-text-link" onClick={() => navigate("/history")}>
              View all <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          {historyLoading ? (
            <div className="dashboard-empty">Loading your recent sessions...</div>
          ) : history.length ? (
            <div className="session-list">
              {history.slice(0, 5).map((session) => (
                <article className="session-row" key={session.id}>
                  <span className="session-icon"><Clock3 size={18} aria-hidden="true" /></span>
                  <div className="session-info">
                    <strong>{sessionLabels[session.session_type] || session.session_type}</strong>
                    <span>{session.tech_stack || new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                  {session.score && <span className="session-score">{session.score}</span>}
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <p>No sessions yet.</p>
              <button onClick={() => navigate("/interview-old")}>Start a mock interview <ArrowRight size={15} /></button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
