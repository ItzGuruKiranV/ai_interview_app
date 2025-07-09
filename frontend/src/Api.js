// src/api.js
import axios from "axios";

// Create an Axios instance with baseURL
const api = axios.create({
  baseURL: "http://localhost:8000",
   // change this if your backend URL differs
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
