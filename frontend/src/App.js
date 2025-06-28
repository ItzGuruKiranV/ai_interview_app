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
        <Navbar />
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume-upload" element={<ResumeUpload />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/interview" element={<AIInterview />} />
          <Route path="/history" element={<History />} />
          <Route path="/interview-old" element={<InterviewPage />} />
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
