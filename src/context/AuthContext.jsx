// context/AuthContext.jsx
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Helper function to get role-specific dashboard path
  const getRoleDashboardPath = (role) => {
    const normalizedRole = role?.toString().toLowerCase().trim();

    switch (normalizedRole) {
      case "super_admin":
      case "super-admin":
        return "/super-admin/dashboard";

      case "school_admin":
      case "school-admin":
        return "/school-admin/dashboard";

      case "teacher":
        return "/teacher/dashboard";

      case "student":
        return "/student/dashboard";

      default:
        console.error("Unknown role:", normalizedRole);
        return "/";
    }
  };

  // Load user on initial mount
  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();

        // Handle different response structures
        let userData = null;
        if (response?.data?.data) {
          userData = response.data.data;
        } else if (response?.data) {
          userData = response.data;
        } else if (response?.user) {
          userData = response.user;
        }

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);

          // Check if user is on landing page or auth pages
          const currentPath = window.location.pathname;
          const isOnAuthPage =
            currentPath === "/login" || currentPath === "/register";
          const isOnLandingPage = currentPath === "/";

          // If user is authenticated and on landing page or auth pages, redirect to dashboard
          if (isOnLandingPage || isOnAuthPage) {
            console.log("User Data:", userData);
            console.log("Role:", userData.role);

            const dashboardPath = getRoleDashboardPath(userData.role);

            console.log("Dashboard Path:", dashboardPath);

            navigate(dashboardPath, { replace: true });
          }
        } else {
          // Token might be invalid
          clearTokens();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      // Check if registration was successful
      if (response?.status === 201 || response?.success === true) {
        toast.success("Registration successful! Redirecting to login...");

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);

        return true;
      } else {
        throw new Error(response?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      // Extract user data from response
      let userData = null;
      let token = null;

      // Handle different response structures
      if (response?.data?.data) {
        userData = response.data.data;
        token = response.data.data?.token || response.data.token;
      } else if (response?.data) {
        userData = response.data.user || response.data;
        token = response.data.token || response.data.access_token;
      } else if (response?.user) {
        userData = response.user;
        token = response.token;
      }

      // If we have user data, set it
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);

        toast.success(
          `Welcome back, ${userData.firstName || userData.first_name || userData.username || "User"}!`,
        );

        // Get role-specific dashboard path
        const dashboardPath = getRoleDashboardPath(userData.role);

        // Redirect to role-specific dashboard
        navigate(dashboardPath, {
          replace: true,
        });
        return true;
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Optional: Call logout API if your backend has one
      // await authAPI.logout();

      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local data even if API fails
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  // Update user profile
  const updateUser = async (userId, userData) => {
    try {
      const response = await authAPI.updateUserProfile(userId, userData);
      
      let updatedUser = null;
      
      // Handle different response structures
      if (response?.data?.data) {
        updatedUser = response.data.data;
      } else if (response?.data) {
        updatedUser = response.data.user || response.data;
      } else if (response?.user) {
        updatedUser = response.user;
      }
      
      if (updatedUser) {
        // Update user state with new data
        setUser((prev) => ({ 
          ...prev, 
          ...updatedUser,
          firstName: updatedUser.firstName || updatedUser.first_name || prev?.firstName,
          lastName: updatedUser.lastName || updatedUser.last_name || prev?.lastName,
          phone: updatedUser.phone || updatedUser.phoneNumber || prev?.phone,
          image: updatedUser.image || updatedUser.profileImage || prev?.image,
        }));
        toast.success("Profile updated successfully");
        return true;
      } else if (Object.keys(userData).length > 0) {
        // If no response data but we have userData, update local state anyway
        setUser((prev) => ({ ...prev, ...userData }));
        toast.success("Profile updated successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Update user error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update profile";
      toast.error(errorMessage);
      return false;
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      
      if (response?.status === 200 || response?.success === true) {
        toast.success("Password changed successfully");
        return true;
      } else {
        throw new Error(response?.message || "Password change failed");
      }
    } catch (error) {
      console.error("Change password error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to change password";
      toast.error(errorMessage);
      return false;
    }
  };

  // Delete user account
  const deleteAccount = async (userId, password) => {
    try {
      const response = await authAPI.deleteUserAccount(userId, password);
      
      if (response?.status === 200 || response?.success === true) {
        toast.success("Account deleted successfully");
        // Clear tokens and logout
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
        return true;
      } else {
        throw new Error(response?.message || "Account deletion failed");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete account";
      toast.error(errorMessage);
      return false;
    }
  };

  const value = {
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
    getRoleDashboardPath, // Expose this helper function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};