import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ArrowUpRight, Check, Code2, FileText, Mic2 } from "lucide-react";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";

import { setTokenProvider } from "./Api";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ResumeUpload from "./pages/ResumeUpload";
import TestPage from "./pages/TestPage";
import History from "./pages/history";
import InterviewPage from "./pages/interview";

const authAppearance = {
  variables: {
    colorPrimary: "#c5f36b",
    colorBackground: "#101a16",
    colorText: "#f4f5ef",
    colorTextSecondary: "#a4b0a8",
    borderRadius: "8px",
  },
  elements: {
    card: "auth-clerk-card",
    headerTitle: "auth-clerk-title",
    headerSubtitle: "auth-clerk-subtitle",
    formFieldLabel: "auth-clerk-label",
    formFieldInput: "auth-clerk-input",
    formButtonPrimary: "auth-clerk-primary",
    footerActionLink: "auth-clerk-link",
  },
};

function AuthShell({ children, mode }) {
  const isSignIn = mode === "sign-in";

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="InterviewElevate">
        <a className="auth-brand" href="/">
          <span className="auth-brand-mark">IE</span>
          <span>InterviewElevate</span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <div className="auth-story-copy">
          <p className="auth-eyebrow">A quieter kind of preparation</p>
          <h1>Make the next interview feel familiar.</h1>
          <p className="auth-description">
            Resume feedback, focused coding practice, and technical mock interviews in one workspace.
          </p>
        </div>
        <div className="auth-capabilities">
          <span><FileText size={17} /> Resume review</span>
          <span><Code2 size={17} /> Coding practice</span>
          <span><Mic2 size={17} /> Mock interviews</span>
        </div>
        <p className="auth-story-foot">Your practice history stays with your account.</p>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-heading">
          <span className="auth-form-check"><Check size={17} /></span>
          <span>{isSignIn ? "Your workspace is ready" : "Start your practice workspace"}</span>
        </div>
        <div className="auth-clerk-wrap">
          {React.cloneElement(children, { appearance: authAppearance })}
        </div>
        <p className="auth-privacy-note">Secure sign-in powered by Clerk</p>
      </section>
    </main>
  );
}

function App() {
  const { getToken } = useAuth();
  setTokenProvider(getToken);

  return (
    <div className="min-h-screen bg-[#050b1a]">
      <SignedIn>
        <Routes>
          {/* Pages WITH Navbar + UserButton */}
          {["/", "/resume-upload", "/history", "/interview-old"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <>
                  <Navbar />
                  <div className="fixed top-4 right-16 z-[200] md:right-4">
                    <UserButton afterSignOutUrl="/sign-in" />
                  </div>
                  {path === "/" && <Home />}
                  {path === "/resume-upload" && <ResumeUpload />}
                  {path === "/history" && <History />}
                  {path === "/interview-old" && <InterviewPage />}
                </>
              }
            />
          ))}

          {/* TestPage — no Navbar, full screen */}
          <Route path="/test" element={<TestPage />} />

          {/* Alias /interview → /interview-old */}
          <Route path="/interview" element={<Navigate to="/interview-old" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedIn>

      <SignedOut>
        <Routes>
          <Route
            path="/sign-in/*"
            element={(
              <AuthShell mode="sign-in">
                <SignIn routing="path" path="/sign-in" />
              </AuthShell>
            )}
          />
          <Route
            path="/sign-up/*"
            element={(
              <AuthShell mode="sign-up">
                <SignUp routing="path" path="/sign-up" />
              </AuthShell>
            )}
          />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </div>
  );
}

export default App;
