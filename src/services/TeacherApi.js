// services/teacherApi.js
// Teacher API service for authenticated teacher endpoints
// Base path: /api/v1/teacher

import api from "./mainApi";

// ==================== TEACHER API ====================

export const teacherApi = {
  // ── Profile ─────────────────────────────────────────────
  /**
   * Get teacher profile
   * GET /teacher/profile
   */
  getProfile: async () => {
    const response = await api.get("/teacher/profile");
    return response.data;
  },

  // ── Students ─────────────────────────────────────────────
  /**
   * Get students assigned to the teacher
   * GET /teacher/students
   * Returns students who are enrolled in classes/subjects taught by this teacher
   */
  getStudents: async () => {
    const response = await api.get("/teacher/students");
    return response.data;
  },

  // ── Classes & Subjects ──────────────────────────────────
  /**
   * Get assigned classes for the teacher
   * GET /teacher/classes
   */
  getAssignedClasses: async () => {
    const response = await api.get("/teacher/classes");
    return response.data;
  },

  /**
   * Get assigned subjects for the teacher
   * GET /teacher/subjects
   */
  getAssignedSubjects: async () => {
    const response = await api.get("/teacher/subjects");
    return response.data;
  },

  /**
   * Get teacher's timetable
   * GET /teacher/timetable
   */
  getTimetable: async () => {
    const response = await api.get("/teacher/timetable");
    return response.data;
  },

  // ── Results Management ──────────────────────────────────
  /**
   * Upload/Submit result
   * POST /teacher/results
   * @param {Object} resultData - { studentId, subjectId, classId, armId, sessionId, termId, testScore, examScore, totalScore, grade, remarks }
   */
  uploadResult: async (resultData) => {
    const response = await api.post("/teacher/results", resultData);
    return response.data;
  },

  /**
   * Edit result
   * PATCH /teacher/results/:id
   * @param {string} resultId - Result record ID
   * @param {Object} resultData - { testScore, examScore, totalScore, grade, remarks }
   */
  editResult: async (resultId, resultData) => {
    const response = await api.patch(`/teacher/results/${resultId}`, resultData);
    return response.data;
  },

  /**
   * Resubmit rejected result
   * PATCH /teacher/results/:id/resubmit
   * @param {string} resultId - Result record ID
   * @param {Object} resultData - { testScore, examScore, totalScore, grade, remarks }
   */
  resubmitRejectedResult: async (resultId, resultData) => {
    const response = await api.patch(`/teacher/results/${resultId}/resubmit`, resultData);
    return response.data;
  },

  /**
   * Get result approval status
   * GET /teacher/results/status
   * @param {Object} params - { classId, subjectId, sessionId, termId }
   */
  getResultApprovalStatus: async (params) => {
    const response = await api.get("/teacher/results/status", { params });
    return response.data;
  },

  // ── Attendance Management ───────────────────────────────
  /**
   * Record attendance
   * POST /teacher/attendance
   * @param {Object} attendanceData - { classArmId, studentId, date, status, remarks }
   */
  recordAttendance: async (attendanceData) => {
    const response = await api.post("/teacher/attendance", attendanceData);
    return response.data;
  },

  /**
   * Update attendance
   * PATCH /teacher/attendance/:id
   * @param {string} attendanceId - Attendance record ID
   * @param {Object} attendanceData - { status, remarks }
   */
  updateAttendance: async (attendanceId, attendanceData) => {
    const response = await api.patch(`/teacher/attendance/${attendanceId}`, attendanceData);
    return response.data;
  },

  /**
   * View attendance records
   * GET /teacher/attendance
   * @param {Object} params - { classArmId, studentId, startDate, endDate }
   */
  viewAttendance: async (params) => {
    const response = await api.get("/teacher/attendance", { params });
    return response.data;
  },

  // ── Announcements & Notifications ───────────────────────
  /**
   * Get visible announcements for teacher
   * GET /teacher/announcements
   */
  getAnnouncements: async () => {
    const response = await api.get("/teacher/announcements");
    return response.data;
  },

  /**
   * Get visible notifications for teacher
   * GET /teacher/notifications
   */
  getNotifications: async () => {
    const response = await api.get("/teacher/notifications");
    return response.data;
  },

  /**
   * Mark notification as read
   * PATCH /teacher/notifications/:id/read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/teacher/notifications/${notificationId}/read`);
    return response.data;
  },

  // ── Reports & Analytics ─────────────────────────────────
  /**
   * Generate reports
   * GET /teacher/reports
   * @param {Object} params - { type, classId, subjectId, sessionId, termId, format }
   */
  generateReports: async (params) => {
    const response = await api.get("/teacher/reports", { params });
    return response.data;
  },

  /**
   * Get teaching analytics
   * GET /teacher/analytics
   * @param {Object} params - { period, classId, subjectId }
   */
  getTeachingAnalytics: async (params) => {
    const response = await api.get("/teacher/analytics", { params });
    return response.data;
  },
};

export default teacherApi;