// context/AuthContext.jsx
// ─── FIXED: Login response shape is response.data.data.{user, token} ─────────
//
// ACTUAL API RESPONSE (from network tab):
// axios wraps the HTTP body in response.data, so:
//   response.data = {
//     status: 200, success: true, message: "login was successful",
//     data: {
//       token: "eyJ…",
//       user:  { id, email, firstName, lastName, role, schoolId, school, … }
//     }
//   }
//
// Therefore:
//   token → response.data.data.token
//   user  → response.data.data.user
//
// The old code read response?.data?.user which is UNDEFINED (there is no user
// at that level — it sits one level deeper inside .data.data).
// Same bug applied to getCurrentUser response parsing.

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../services/authApi";
import {
  setAccessToken,
  clearTokens,
  getAccessToken,
} from "../services/mainApi";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  // ─── Role → dashboard path ──────────────────────────────────────────────────
  const getRoleDashboardPath = (role) => {
    switch (role?.toLowerCase()?.trim().replace("-", "_")) {
      case "super_admin":  return "/super-admin/dashboard";
      case "school_admin": return "/school-admin/dashboard";
      case "teacher":      return "/teacher/dashboard";
      case "student":      return "/student/dashboard";
      default:
        console.warn("Unknown role:", role);
        return "/";
    }
  };

  // ─── Load persisted user on mount ──────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();
      if (!token) { setLoading(false); return; }

      try {
        const response = await authAPI.getCurrentUser();

        // getCurrentUser response shape:
        // { status, success, message, data: { ...userFields } }
        // so axios gives us: response.data.data = the user object
        const userData = response?.data?.data ?? response?.data;

        if (userData?.id) {
          setUser(userData);
          setIsAuthenticated(true);

          // Redirect away from public pages if already authenticated
          const path = window.location.pathname;
          if (path === "/login" || path === "/register" || path === "/") {
            navigate(getRoleDashboardPath(userData.role), { replace: true });
          }
        } else {
          clearTokens();
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      if (response?.data?.success || response?.status === 201) {
        toast.success("Registration successful! Please log in.");
        navigate("/login");
        return true;
      }

      throw new Error(response?.data?.message || "Registration failed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Registration failed");
      return false;
    }
  };

  // ─── Login ──────────────────────────────────────────────────────────────────
  // ACTUAL response path:
  //   axios response → .data         = { status, success, message, data:{token,user} }
  //   the user object                = response.data.data.user
  //   the token                      = response.data.data.token
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      // Step 1: unwrap the Axios envelope (.data) then the API envelope (.data)
      const payload  = response?.data?.data;          // { token, user }
      const userData = payload?.user;
      const token    = payload?.token;

      if (!userData || !token) {
        throw new Error("Invalid response from server — missing user or token");
      }

      // Step 2: persist the token so future requests are authenticated
      setAccessToken(token);

      // Step 3: store user in context
      setUser(userData);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${userData.firstName || "User"}!`);

      // Step 4: redirect to the correct role dashboard
      navigate(getRoleDashboardPath(userData.role), { replace: true });

      return true;
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.message || err.message || "Login failed");
      return false;
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  };

  // ─── Update profile ─────────────────────────────────────────────────────────
  const updateUser = async (userId, data) => {
    try {
      const response = await authAPI.updateUserProfile(userId, data);
      const updated  = response?.data?.data ?? response?.data;

      if (updated?.id) {
        setUser(prev => ({ ...prev, ...updated }));
        toast.success("Profile updated");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Update failed");
      return false;
    }
  };

  // ─── Change password ────────────────────────────────────────────────────────
  const changePassword = async (data) => {
    try {
      const res = await authAPI.changePassword(data);
      if (res?.data?.success || res?.status === 200) {
        toast.success("Password changed successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Password change failed");
      return false;
    }
  };

  // ─── Delete account ─────────────────────────────────────────────────────────
  const deleteAccount = async (userId, password) => {
    try {
      const res = await authAPI.deleteUserAccount(userId, password);
      if (res?.data?.success || res?.status === 200) {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
        toast.success("Account deleted");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Delete failed");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        updateUser,
        changePassword,
        deleteAccount,
        getRoleDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};