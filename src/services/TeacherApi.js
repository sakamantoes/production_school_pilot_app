// services/teacherApi.js
// Teacher API service for authenticated teacher endpoints
// Base path: /api/v1/teacher

import api from "./mainApi";

// Helper to extract array from response
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [
    res, res.data, res.data?.data,
    ...keys.map(k => res[k]),
    ...keys.map(k => res.data?.[k]),
  ];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

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

// ==================== HELPER FUNCTIONS ====================

/**
 * Get teacher's assigned classes as array
 */
export const getTeacherClasses = async () => {
  const res = await teacherApi.getAssignedClasses();
  return toArray(res, 'classes', 'data');
};

/**
 * Get teacher's assigned subjects as array
 */
export const getTeacherSubjects = async () => {
  const res = await teacherApi.getAssignedSubjects();
  return toArray(res, 'subjects', 'data');
};

/**
 * Get teacher's timetable as array
 */
export const getTeacherTimetable = async () => {
  const res = await teacherApi.getTimetable();
  return toArray(res, 'entries', 'timetable', 'data');
};

/**
 * Get announcements for teacher
 */
export const getTeacherAnnouncements = async () => {
  const res = await teacherApi.getAnnouncements();
  return toArray(res, 'announcements', 'data');
};

/**
 * Get notifications for teacher
 */
export const getTeacherNotifications = async () => {
  const res = await teacherApi.getNotifications();
  return toArray(res, 'notifications', 'data');
};

// ==================== DEFAULT EXPORT ====================

export default teacherApi;