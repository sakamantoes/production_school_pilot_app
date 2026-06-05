import api, { setAccessToken } from "./mainApi";

// Helper to extract token from various possible response shapes
const extractToken = (respData) => {
  if (!respData) return null;

  // Common shapes we might get from different backends
  if (typeof respData === "string") return respData;
  if (respData.token && typeof respData.token === "string") return respData.token;
  if (respData.access_token && typeof respData.access_token === "string") return respData.access_token;
  if (respData.data && typeof respData.data === "string") return respData.data;
  if (respData.data && typeof respData.data === "object") {
    if (respData.data.token) return respData.data.token;
    if (respData.data.access_token) return respData.data.access_token;
  }

  return null;
};

// ==================== AUTH API ====================
export const authAPI = {
  // Register new school and admin
  register: async (userData) => {
    const response = await api.post("auth/school/register", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("auth/login", credentials);

    // Try to extract a raw JWT from common response shapes
    const token = extractToken(response.data) || extractToken(response.data?.data) || null;
    if (token) {
      setAccessToken(token);
      // Store a flag (not the token) for quick debug checks
      try { localStorage.setItem('auth_token_present', '1'); } catch {};
    }

    return response.data;
  },

  // Get current user (from token)
  getCurrentUser: async () => {
    const response = await api.get("auth/me");
    return response.data;
  },

  // Admin / user management helpers used across the app
  getUsers: async (params) => {
    const response = await api.get("admin/users", { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, payload) => {
    const response = await api.put(`admin/users/${userId}`, payload);
    return response.data;
  },
};
