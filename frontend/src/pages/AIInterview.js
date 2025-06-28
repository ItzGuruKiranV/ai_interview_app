import { useState, useEffect, useRef } from 'react';
import { Mic, Video, Loader2, CheckCircle, AlertCircle, Star, ChevronDown } from 'lucide-react';

// View Component
function AIInterviewView({
  interviewState,
  questions,
  currentQuestion,
  transcript,
  skillsAssessment,
  review,
  videoRef,
  startInterview
}) {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">AI Production Skills Interview</h1>
        <p className="text-gray-600">Real-time assessment of technical and operational competencies</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Live Interview</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${interviewState === 'ready' ? 'bg-yellow-500' : 
                                 interviewState === 'in-progress' ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm">
                  {interviewState === 'ready' ? 'Ready' : 
                   interviewState === 'in-progress' ? 'Active' : 'Completed'}
                </span>
              </div>
            </div>

            <div className="p-4">
              {interviewState === 'ready' ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
                        <Mic className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Begin Interview</h3>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    The AI will ask questions tailored to your production experience and evaluate your responses.
                  </p>
                  <button
                    onClick={startInterview}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                  >
                    <span>Start Interview</span>
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ paddingBottom: '56.25%' }}>
                    {interviewState === 'in-progress' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-white">AI is analyzing your response...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>

                  {interviewState === 'in-progress' && currentQuestion < questions.length && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                          <div className="h-6 w-6 text-blue-600 flex items-center justify-center">
                            <span>AI</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{questions[currentQuestion].text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {questions[currentQuestion].skill}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {questions[currentQuestion].difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {transcript && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Response Transcript</h4>
                      <p className="text-gray-800">{transcript}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Panel */}
        <div className="space-y-6">
          {interviewState === 'completed' ? (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gray-800 text-white p-4">
                  <h3 className="font-medium">Interview Results</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700">Overall Score</span>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold mr-2">{review.overallScore}</span>
                      <span className="text-gray-500">/100</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(skillsAssessment).map(([skill, data]) => (
                      <div key={skill} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{skill}</span>
                          <span className="font-semibold">{data.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              data.score >= 80 ? 'bg-green-500' :
                              data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{data.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gray-800 text-white p-4">
                  <h3 className="font-medium">Detailed Review</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {review.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                      Areas for Improvement
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {review.areasForImprovement.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Recommendation</h4>
                    <p className="text-blue-700">{review.recommendation}</p>
                  </div>

                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Download Full Report
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h3 className="font-medium">Skills Being Assessed</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {questions.map((q) => (
                    <li key={q.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 mt-1 h-5 w-5 rounded-full flex items-center justify-center ${
                        currentQuestion >= q.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {currentQuestion >= q.id ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">{q.id}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{q.skill}</p>
                        <p className="text-xs text-gray-500">{q.difficulty} level</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {interviewState === 'in-progress' && (
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-start space-x-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      AI is analyzing your skills in real-time. Speak clearly and provide specific examples from your production experience.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Container Component
export default function AIInterviewContainer() {
  const [interviewState, setInterviewState] = useState('ready'); // ready, in-progress, completed
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [skillsAssessment, setSkillsAssessment] = useState(null);
  const [review, setReview] = useState(null);
  const videoRef = useRef(null);
  const [transcript, setTranscript] = useState('');

  // Sample questions based on candidate's profile
  const questions = [
    {
      id: 1,
      text: "Can you explain your experience with production line optimization?",
      skill: "Production Management",
      difficulty: "Intermediate"
    },
    {
      id: 2,
      text: "Describe a time you implemented quality control measures that improved output.",
      skill: "Quality Assurance",
      difficulty: "Advanced"
    },
    {
      id: 3,
      text: "How would you handle a sudden equipment failure during peak production?",
      skill: "Problem Solving",
      difficulty: "Beginner"
    }
  ];

  // Start the interview simulation
  const startInterview = () => {
    setInterviewState('in-progress');
    setCurrentQuestion(0);
    setTranscript('');
    setSkillsAssessment(null);
    setReview(null);
  };

  // Simulate AI processing and generate review
  const completeInterview = () => {
    setInterviewState('completed');
    setTimeout(() => {
      setSkillsAssessment({
        "Production Management": { score: 82, feedback: "Strong theoretical knowledge but lacks recent practical application" },
        "Quality Assurance": { score: 91, feedback: "Excellent understanding of quality metrics and improvement techniques" },
        "Problem Solving": { score: 75, feedback: "Good basic troubleshooting skills but could benefit from more structured approaches" }
      });

      setReview({
        overallScore: 83,
        strengths: [
          "Deep knowledge of quality control standards",
          "Effective communication of technical concepts",
          "Positive attitude toward process improvement"
        ],
        areasForImprovement: [
          "Need more hands-on experience with modern production equipment",
          "Could develop more proactive problem-solving approaches",
          "Would benefit from additional lean manufacturing training"
        ],
        recommendation: "Strong candidate for mid-level production roles with potential for advancement after additional training"
      });
    }, 2000);
  };

  // Simulate receiving transcript chunks
  useEffect(() => {
    let interval;

    if (interviewState === 'in-progress') {
      const responses = [
        "In my previous role, I worked on optimizing the widget assembly line...",
        "We implemented statistical process control which reduced defects by 23%...",
        "First I would follow emergency shutdown procedures, then..."
      ];

      interval = setInterval(() => {
        if (currentQuestion < questions.length) {
          setTranscript(prev => prev + responses[currentQuestion] + " ");
          setCurrentQuestion(prev => prev + 1);
        } else {
          clearInterval(interval);
          completeInterview();
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  // eslint-disable-next-line
  }, [interviewState, currentQuestion]);

  return (
    <AIInterviewView
      interviewState={interviewState}
      questions={questions}
      currentQuestion={currentQuestion}
      transcript={transcript}
      skillsAssessment={skillsAssessment}
      review={review}
      videoRef={videoRef}
      startInterview={startInterview}
    />
  );
}