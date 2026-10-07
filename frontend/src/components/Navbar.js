import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTestModal, setShowTestModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", path: "/" },
    { label: "Resume", path: "/resume-upload" },
    { label: "Interview", path: "/interview-old" },
    { label: "History", path: "/history" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050b1a]/95 backdrop-blur-xl shadow-lg shadow-black/30 border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div
            id="navbar-logo"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-xl w-10 h-10 flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/40">
              IE
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight hidden sm:block">
              InterviewElevate
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) =>
              link.label === "Test" ? null : (
                <button
                  key={link.path}
                  id={`nav-${link.label.toLowerCase()}`}
                  onClick={() =>
                    link.label === "Test"
                      ? setShowTestModal(true)
                      : navigate(link.path)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </button>
              )
            )}

            {/* Test button */}
            <button
              id="nav-test"
              onClick={() => setShowTestModal(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive("/test")
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Test
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            id="nav-mobile-menu"
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#050b1a]/98 border-t border-white/10 px-6 py-4 flex flex-col gap-2">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  if (link.label === "Test") {
                    setShowTestModal(true);
                  } else {
                    navigate(link.path);
                  }
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { setShowTestModal(true); setMobileOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Test
            </button>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content hiding under fixed navbar */}
      <div className="h-[72px]" />

      {/* Test Confirm Modal */}
      {showTestModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTestModal(false)}
        >
          <div
            className="bg-[#0a1629] border border-blue-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4 text-center">🧪</div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Start Coding Test?</h2>
            <p className="text-blue-300 text-sm text-center mb-6">
              You will be given a coding challenge with a 60-second timer. Are you ready?
            </p>
            <div className="flex gap-3">
              <button
                id="modal-start-test"
                onClick={() => { navigate("/test"); setShowTestModal(false); }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-2.5 rounded-xl transition"
              >
                Yes, Start!
              </button>
              <button
                id="modal-cancel-test"
                onClick={() => setShowTestModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
