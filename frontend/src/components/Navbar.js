import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const [showTestModal, setShowTestModal] = useState(false);


  return (
    <nav className="bg-black shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo and Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-2xl shadow-md">
            IE
          </span>
          <span className="text-2xl font-extrabold text-white tracking-wide">
            InterviewElevate
          </span>
        </div>
        {/* Navigation Buttons */}
        <div className="space-x-3 hidden md:flex">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-full bg-black text-white font-semibold shadow hover:bg-blue-600 hover:text-white transition duration-200 border border-white"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/resume-upload")}
            className="px-5 py-2 rounded-full bg-black text-white font-semibold shadow hover:bg-blue-600 hover:text-white transition duration-200 border border-white"
          >
            Resume
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className="px-5 py-2 rounded-full bg-black text-white font-semibold shadow hover:bg-blue-600 hover:text-white transition duration-200 border border-white"
          >
            Test
          </button>
          
          <button
            onClick={() => navigate("/history")}
            className="px-5 py-2 rounded-full bg-black text-white font-semibold shadow hover:bg-blue-600 hover:text-white transition duration-200 border border-white"
          >
            History
          </button>
          {showTestModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h2>🧪 Enter Test</h2>
                <p>Are you sure you want to start the test now?</p>
                <div className="modal-actions">
                  <button onClick={() => navigate("/test")}>Yes, Start</button>
                  <button onClick={() => setShowTestModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
