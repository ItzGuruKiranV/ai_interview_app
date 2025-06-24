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



import Home from "./pages/Home";
import ResumeUpload from "./pages/ResumeUpload";
import TestPage from "./pages/TestPage";


function App() {
  return (
    <div style={{ padding: 40 }}>
      <SignedIn>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>AI Interview Portal</h2>
          <UserButton />
        </div>
      </SignedIn>

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <SignedIn>
              <Home />
            </SignedIn>
          }
        />

        {/* Upload Resume */}
        <Route
          path="/resume-upload"
          element={
            <SignedIn>
              <ResumeUpload />
            </SignedIn>
          }
        />

        {/* Test Page */}
        <Route
          path="/test"
          element={
            <SignedIn>
              <TestPage />
            </SignedIn>
          }
        />

        {/* Auth */}
        <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />

        {/* Redirect unauthenticated */}
        <Route
          path="*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
