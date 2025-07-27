// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  //baseURL: "https://blynx-backend.azurewebsites.net",
  baseURL:"https://8c0a9f36c1cd.ngrok-free.app/",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
  (error) => Promise.reject(error)

);
console.log("JWT Token sent:", localStorage.getItem("token"));


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // You could log out the user or redirect to login
      console.warn("Unauthorized, logging out...");
      localStorage.removeItem("token");
      window.location.href = "/login"; // or your login route
    }
    return Promise.reject(error);
  }
);


export default api;
