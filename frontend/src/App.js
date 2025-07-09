import React from "react";
import { Routes, Route } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ResumeUpload from "./pages/ResumeUpload";
import TestPage from "./pages/TestPage";
import AIInterview from "./pages/AIInterview";
import History from "./pages/history";
import InterviewPage from "./pages/interview";

function App() {
  return (
    <div className="min-h-screen">
      <SignedIn>
        <Routes>
          {/* ✅ Routes with Navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <div className="absolute top-4 right-4">
                  <UserButton />
                </div>
                <Home />
              </>
            }
          />
          <Route
            path="/resume-upload"
            element={
              <>
                <Navbar />
                <div className="absolute top-4 right-4">
                  <UserButton />
                </div>
                <ResumeUpload />
              </>
            }
          />
          <Route
            path="/interview"
            element={
              <>
                <Navbar />
                <div className="absolute top-4 right-4">
                  <UserButton />
                </div>
                <AIInterview />
              </>
            }
          />
          <Route
            path="/history"
            element={
              <>
                <Navbar />
                <div className="absolute top-4 right-4">
                  <UserButton />
                </div>
                <History />
              </>
            }
          />
          <Route
            path="/interview-old"
            element={
              <>
                <Navbar />
                <div className="absolute top-4 right-4">
                  <UserButton />
                </div>
                <InterviewPage />
              </>
            }
          />

          {/* ❌ NO Navbar or UserButton on TestPage */}
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </SignedIn>

      <SignedOut>
        <Routes>
          <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </div>
  );
}

export default App;
