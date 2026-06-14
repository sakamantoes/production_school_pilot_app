// services/studentApi.js
// Student API service for authenticated student endpoints
// Base path: /api/v1/student

import api from "./mainApi";

// ==================== STUDENT API ====================

export const studentApi = {
  // ── Profile ─────────────────────────────────────────────
  /**
   * Get student profile
   * GET /student/profile
   */
  getProfile: async () => {
    const response = await api.get("/student/profile");
    return response.data;
  },

  /**
   * Update student profile (limited to contact/avatar fields)
   * PATCH /student/profile
   * @param {Object} profileData - { phone, image }
   */
  updateProfile: async (profileData) => {
    const response = await api.patch("/student/profile", profileData);
    return response.data;
  },

  // ── Academic Information ────────────────────────────────
  /**
   * Get student's classes (enrollment history)
   * GET /student/classes
   */
  getClasses: async () => {
    const response = await api.get("/student/classes");
    return response.data;
  },

  /**
   * Get student's subjects for current enrollment
   * GET /student/subjects
   */
  getSubjects: async () => {
    const response = await api.get("/student/subjects");
    return response.data;
  },

  /**
   * Get student's timetable
   * GET /student/timetable
   */
  getTimetable: async () => {
    const response = await api.get("/student/timetable");
    return response.data;
  },

  // ── Results & Academic Performance ──────────────────────
  /**
   * Get approved results only (pending/rejected are hidden)
   * GET /student/results
   */
  getApprovedResults: async (params) => {
    const response = await api.get("/student/results", { params });
    return response.data;
  },

  /**
   * Get report cards (grouped by session and term)
   * GET /student/report-cards
   */
  getReportCards: async () => {
    const response = await api.get("/student/report-cards");
    return response.data;
  },

  /**
   * Get academic history (enrollments + results + attendance)
   * GET /student/academic-history
   */
  getAcademicHistory: async () => {
    const response = await api.get("/student/academic-history");
    return response.data;
  },

  // ── Attendance ──────────────────────────────────────────
  /**
   * Get attendance records
   * GET /student/attendance
   * @param {Object} params - { startDate, endDate, termId, sessionId }
   */
  getAttendance: async (params) => {
    const response = await api.get("/student/attendance", { params });
    return response.data;
  },

  /**
   * Get attendance summary (present rate, absent count, etc.)
   * GET /student/attendance/summary
   */
  getAttendanceSummary: async () => {
    const response = await api.get("/student/attendance/summary");
    return response.data;
  },

  // ── Announcements & Notifications ───────────────────────
  /**
   * Get visible announcements for student
   * GET /student/announcements
   */
  getAnnouncements: async () => {
    const response = await api.get("/student/announcements");
    return response.data;
  },

  /**
   * Get visible notifications for student
   * GET /student/notifications
   */
  getNotifications: async () => {
    const response = await api.get("/student/notifications");
    return response.data;
  },

  /**
   * Mark notification as read
   * PATCH /student/notifications/:id/read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/student/notifications/${notificationId}/read`);
    return response.data;
  },

  // ── Payments ────────────────────────────────────────────
  /**
   * Get payment summary (fees owed + payment history)
   * GET /student/payments
   */
  getPaymentSummary: async () => {
    const response = await api.get("/student/payments");
    return response.data;
  },
};

export default studentApi;