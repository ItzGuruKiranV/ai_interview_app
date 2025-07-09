import React , {useEffect}  from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import api from "../Api";


function Home() {
  const navigate = useNavigate();
  const { user } = useUser();


useEffect(() => {
  if (user) {
    const email = user?.primaryEmailAddress?.emailAddress;

    api.post("/register", { email })
      .then((res) => {
        console.log("User registered:", res.data);
      })
      .catch((err) => {
        console.error("Error registering user:", err);
      });
  }
}, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800">
      {/* 🔹 Hero Section */}
      <section
        className="bg-cover bg-center bg-no-repeat min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/Humanoid.png')",
        }}
      >
        <div className="bg-black bg-opacity-60 p-10 rounded-lg text-white text-center max-w-3xl">
          <h1 className="text-5xl font-extrabold mb-4">InterviewElevate</h1>
          <p className="text-xl mb-6">Where Preparation Meets AI-Driven Insight</p>
          <button
            className="bg-white text-blue-800 font-semibold py-2 px-6 rounded hover:bg-gray-200 transition"
            onClick={() => navigate("/resume-upload")}
          >
            Upload Resume
          </button>
        </div>
      </section>

      {/* 🔹 Features Section */}
      <section className="py-16 px-4 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">Key Features</h2>
        <div className="max-w-6xl mx-auto grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 text-center">
          {[
            { title: "Resume Analysis", desc: "AI-driven scoring and keyword checks." },
            { title: "AI Mock Interview", desc: "Simulated questions based on your resume." },
            { title: "Emotion & Speech Feedback", desc: "Analyze facial expressions and voice tone." },
            { title: "Personalized Suggestions", desc: "Targeted advice to improve your performance." },
          ].map((f, idx) => (
            <div
              key={idx}
              className="border rounded-xl shadow-lg p-6 hover:shadow-xl transition bg-blue-50"
            >
              <h3 className="text-xl font-semibold text-blue-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🔹 How It Works */}
      <section className="py-16 px-4 bg-blue-50">
        <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">How It Works</h2>
        <div className="max-w-4xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-3 text-center">
          {["Upload Resume", "Take Mock Interview", "Get Feedback"].map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-400"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">{i + 1}</div>
              <p className="font-medium text-gray-800">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🔹 Footer */}
      <footer className="py-8 px-4 bg-blue-900 text-white text-center">
        <p className="font-semibold">XYZ College, Department of Computer Science</p>
        <p className="text-sm mt-1">
          Developed by Team IntelliPrep | <a className="underline" href="https://github.com/ItzGuruKiranV/ai_interview_app">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default Home;
