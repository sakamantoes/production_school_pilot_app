// services/mainApi.js
import axios from "axios";

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "https://school-pilot-2.onrender.com";

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management functions
const getAccessToken = () => localStorage.getItem("access_token");
const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  }
};
const clearTokens = () => localStorage.removeItem("access_token");

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      clearTokens();
      // Optionally redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { getAccessToken, setAccessToken, clearTokens };