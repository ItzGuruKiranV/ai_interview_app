import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import api from "../Api"; // your Axios instance

function History() {
  const { user } = useUser();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (!userEmail) return;

      try {
        const res = await api.get(`/history?email=${userEmail}`);
        setEmail(res.data.email || "Not found");
      } catch (err) {
        console.error("Error fetching history", err);
        setEmail("Error");
      }
    };

    if (user) fetchHistory();
  }, [user]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Email</h2>
        <p className="text-gray-700 text-lg">{email}</p>
      </div>
    </div>
  );
}

export default History;
