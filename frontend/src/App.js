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

import Navbar from "./components/Navbar"; // ✅ Importing Navbar
import Home from "./pages/Home";
import ResumeUpload from "./pages/ResumeUpload";
import TestPage from "./pages/TestPage";
import AIInterview from "./pages/AIInterview";


function App() {
  return (
    <div className="min-h-screen">
      {/* Show Navbar and UserButton only when signed in */}
      <SignedIn>
        <Navbar />
        <div className="absolute top-4 right-4">
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

        {/* Auth Pages */}
        <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />

        {/* Redirect unauthenticated users */}
        <Route
          path="*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
        <Route
          path="/interview"
          element={
            <SignedIn>
              <AIInterview />
            </SignedIn>
          }
        />

      </Routes>
    </div>
  );
}

export default App;
