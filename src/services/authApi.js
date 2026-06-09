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

    console.log(`Login response:`, response);

    // Try to extract a raw JWT from common response shapes
    const token = extractToken(response.data) || extractToken(response.data?.data) || null;
    if (token) {
      setAccessToken(token);
      // Store a flag (not the token) for quick debug checks
      try { localStorage.setItem('auth_token_present', '1'); } catch {};
    }

    return response;
  },

  // Get current user (from token)
  getCurrentUser: async () => {
    const response = await api.get("auth/me");
    return response.data;
  },

  // Get user by ID (for viewing other users)
  getUserById: async (userId) => {
    const response = await api.get(`auth/user/${userId}`);
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (userId, userData) => {
    const response = await api.put(`auth/user/${userId}`, userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post("auth/user/change-password", passwordData);
    return response.data;
  },

  // Delete user account
  deleteUserAccount: async (userId, password) => {
    const response = await api.delete(`auth/user/${userId}`, {
      data: { password } // Send password in the request body for DELETE
    });
    return response.data;
  },
};

// Export individual functions for convenience
export const {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUserAccount
} = authAPI;