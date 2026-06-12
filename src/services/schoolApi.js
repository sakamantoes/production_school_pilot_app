// service/school.js
import api from "./mainApi";

// ==================== SCHOOL PROFILE API ====================
export const schoolProfileAPI = {
  // Get school profile
  getSchoolProfile: async () => {
    const response = await api.get("/admin/school");
    return response.data;
  },

  // Update school profile
  updateSchoolProfile: async (schoolData) => {
    const response = await api.patch("/admin/school", schoolData);
    return response.data;
  },
};

// ==================== TEACHER API ====================
export const teacherAPI = {
  // Create teacher
  createTeacher: async (teacherData) => {
    const response = await api.post("/admin/teachers", teacherData);
    return response.data;
  },

  // Get all teachers
  getTeachers: async (params) => {
    const response = await api.get("/admin/teachers", { params });
    return response.data;
  },

  // Get single teacher
  getTeacher: async (teacherId) => {
    const response = await api.get(`/admin/teachers/${teacherId}`);
    return response.data;
  },

  // Update teacher
  updateTeacher: async (teacherId, teacherData) => {
    const response = await api.patch(`/admin/teachers/${teacherId}`, teacherData);
    return response.data;
  },

  // Delete teacher
  deleteTeacher: async (teacherId) => {
    const response = await api.delete(`/admin/teachers/${teacherId}`);
    return response.data;
  },

   activateTeacher: async (teacherId) => {
    const response = await api.patch(`/admin/teachers/${teacherId}/activate`);
    return response.data;
  },

  // Assign teacher to class/subject
  assignTeacher: async (assignmentData) => {
    const response = await api.post("/admin/teacher-assignments", assignmentData);
    return response.data;
  },

  // Remove teacher assignment
  removeTeacherAssignment: async (assignmentId) => {
    const response = await api.delete(`/admin/teacher-assignments/${assignmentId}`);
    return response.data;
  },
};

// ==================== STUDENT API ====================
// Drop-in replacement for the studentAPI section in schoolApi.js
// Fixes: permanentlyDeleteStudent uses correct endpoint DELETE /admin/students/:id

export const studentAPI = {
  // Create student
  createStudent: async (studentData) => {
    const response = await api.post("/admin/students", studentData);
    return response.data;
  },

  // Get all students
  getStudents: async (params) => {
    const response = await api.get("/admin/students", { params });
    return response.data;
  },

  // Get single student
  getStudent: async (studentId) => {
    const response = await api.get(`/admin/students/${studentId}`);
    return response.data;
  },

  // Update student
  updateStudent: async (studentId, studentData) => {
    const response = await api.patch(`/admin/students/${studentId}`, studentData);
    return response.data;
  },

  // Soft delete — deactivates account, keeps data
  deleteStudent: async (studentId) => {
    const response = await api.delete(`/admin/students/${studentId}/deactivate`);
    return response.data;
  },

  // Reactivate a deactivated student
  activateStudent: async (studentId) => {
    const response = await api.post(`/admin/students/${studentId}/activate`);
    return response.data;
  },

  // Hard delete — permanently removes student and all related data
  // Calls DELETE /admin/students/:id  (NOT /deactivate)
  permanentlyDeleteStudent: async (studentId) => {
    const response = await api.delete(`/admin/students/${studentId}`);
    return response.data;
  },

  // Enroll student in class/session/term
  enrollStudent: async (enrollmentData) => {
    const response = await api.post("/admin/students/enroll", enrollmentData);
    return response.data;
  },

  // Graduate student
  graduateStudent: async (studentId) => {
    const response = await api.patch(`/admin/students/${studentId}/graduate`);
    return response.data;
  },
};

// ==================== CLASS API ====================
export const classAPI = {
  // Create class
  createClass: async (classData) => {
    const response = await api.post("/admin/classes", classData);
    return response.data;
  },

  // Get all classes
  getClasses: async (params) => {
    const response = await api.get("/admin/classes", { params });
    return response.data;
  },

  // Update class
  updateClass: async (classId, classData) => {
    const response = await api.patch(`/admin/classes/${classId}`, classData);
    return response.data;
  },

  // Delete class
  deleteClass: async (classId) => {
    const response = await api.delete(`/admin/classes/${classId}`);
    return response.data;
  },
};

// ==================== CLASS ARM API ====================
export const classArmAPI = {
  // Create class arm
  createClassArm: async (classArmData) => {
    const response = await api.post("/admin/class-arms", classArmData);
    return response.data;
  },

  // Update class arm
  updateClassArm: async (classArmId, classArmData) => {
    const response = await api.patch(`/admin/class-arms/${classArmId}`, classArmData);
    return response.data;
  },

  // Delete class arm
  deleteClassArm: async (classArmId) => {
    const response = await api.delete(`/admin/class-arms/${classArmId}`);
    return response.data;
  },
};

// ==================== SUBJECT API ====================
export const subjectAPI = {
  // Create subject
  createSubject: async (subjectData) => {
    const response = await api.post("/admin/subjects", subjectData);
    return response.data;
  },

  // Get all subjects
  getSubjects: async (params) => {
    const response = await api.get("/admin/subjects", { params });
    return response.data;
  },

  // Update subject
  updateSubject: async (subjectId, subjectData) => {
    const response = await api.patch(`/admin/subjects/${subjectId}`, subjectData);
    return response.data;
  },

  // Delete subject
  deleteSubject: async (subjectId) => {
    const response = await api.delete(`/admin/subjects/${subjectId}`);
    return response.data;
  },
};

// ==================== SESSION API ====================
export const sessionAPI = {
  // Create session
  createSession: async (sessionData) => {
    const response = await api.post("/admin/sessions", sessionData);
    return response.data;
  },

  // Get all sessions
  getSessions: async (params) => {
    const response = await api.get("/admin/sessions", { params });
    return response.data;
  },

  // Update session
  updateSession: async (sessionId, sessionData) => {
    const response = await api.patch(`/admin/sessions/${sessionId}`, sessionData);
    return response.data;
  },
};

// ==================== TERM API ====================
export const termAPI = {
  // Create term
  createTerm: async (termData) => {
    const response = await api.post("/admin/terms", termData);
    return response.data;
  },

  // Get all terms
  getTerms: async (params) => {
    const response = await api.get("/admin/terms", { params });
    return response.data;
  },

  // Update term
  updateTerm: async (termId, termData) => {
    const response = await api.patch(`/admin/terms/${termId}`, termData);
    return response.data;
  },
};

// ==================== FEE API ====================
export const feeAPI = {
  // Create fee
  createFee: async (feeData) => {
    const response = await api.post("/admin/fees", feeData);
    return response.data;
  },

  // Get all fees
  getFees: async (params) => {
    const response = await api.get("/admin/fees", { params });
    return response.data;
  },

  // Update fee
  updateFee: async (feeId, feeData) => {
    const response = await api.patch(`/admin/fees/${feeId}`, feeData);
    return response.data;
  },

  // Delete fee
  deleteFee: async (feeId) => {
    const response = await api.delete(`/admin/fees/${feeId}`);
    return response.data;
  },
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  // Get all payments
  getPayments: async (params) => {
    const response = await api.get("/admin/payments", { params });
    return response.data;
  },
};

// ==================== WALLET & ANALYTICS API ====================
export const walletAPI = {
  // Get school wallet
  getSchoolWallet: async () => {
    const response = await api.get("/admin/wallet");
    return response.data;
  },
};

export const analyticsAPI = {
  // Get school analytics
  getSchoolAnalytics: async (params) => {
    const response = await api.get("/admin/analytics", { params });
    return response.data;
  },
};

// ==================== TIMETABLE API ====================
export const timetableAPI = {
  // Create timetable
  createTimetable: async (timetableData) => {
    const response = await api.post("/admin/timetables", timetableData);
    return response.data;
  },

  // Get all timetables
  getTimetables: async (classId) => {
    const params = classId ? { classId } : {};
    const response = await api.get("/admin/timetables", { params });
    return response.data;
  },

  // Get single timetable
  getTimetable: async (timetableId) => {
    const response = await api.get(`/admin/timetables/${timetableId}`);
    return response.data;
  },

  // Update timetable
  updateTimetable: async (timetableId, timetableData) => {
    const response = await api.patch(`/admin/timetables/${timetableId}`, timetableData);
    return response.data;
  },

  // Delete timetable
  deleteTimetable: async (timetableId) => {
    const response = await api.delete(`/admin/timetables/${timetableId}`);
    return response.data;
  },

  // Add timetable entry
  addTimetableEntry: async (timetableId, entryData) => {
    const response = await api.post(`/admin/timetables/${timetableId}/entries`, entryData);
    return response.data;
  },

  // Update timetable entry
  updateTimetableEntry: async (entryId, entryData) => {
    const response = await api.patch(`/admin/timetable-entries/${entryId}`, entryData);
    return response.data;
  },

  // Delete timetable entry
  deleteTimetableEntry: async (entryId) => {
    const response = await api.delete(`/admin/timetable-entries/${entryId}`);
    return response.data;
  },
};

// ==================== RESULT APPROVAL API ====================
export const resultApprovalAPI = {
  // Get classes with pending results
  getPendingResultClasses: async () => {
    const response = await api.get("/admin/results/pending-classes");
    return response.data;
  },

  // Get result approval statistics
  getResultApprovalStats: async () => {
    const response = await api.get("/admin/results/approval-stats");
    return response.data;
  },

  // Get approval history
  getApprovalHistory: async () => {
    const response = await api.get("/admin/results/approval-history");
    return response.data;
  },

  // Get results by class
  getResultsByClass: async (classId, armId, status) => {
    const params = {};
    if (armId) params.armId = armId;
    if (status) params.status = status;
    const response = await api.get(`/admin/classes/${classId}/results`, { params });
    return response.data;
  },

  // Approve single result
  approveResult: async (resultId, decisionData) => {
    const response = await api.patch(`/admin/results/${resultId}/approve`, decisionData);
    return response.data;
  },

  // Reject single result
  rejectResult: async (resultId, decisionData) => {
    const response = await api.patch(`/admin/results/${resultId}/reject`, decisionData);
    return response.data;
  },

  // Bulk approve results
  bulkApproveResults: async (bulkData) => {
    const response = await api.patch("/admin/results/bulk-approve", bulkData);
    return response.data;
  },

  // Bulk reject results
  bulkRejectResults: async (bulkData) => {
    const response = await api.patch("/admin/results/bulk-reject", bulkData);
    return response.data;
  },
};

// ==================== ANNOUNCEMENT API ====================
export const announcementAPI = {
  // Create announcement
  createAnnouncement: async (announcementData) => {
    const response = await api.post("/admin/announcements", announcementData);
    return response.data;
  },

  // Get all announcements
  getAnnouncements: async () => {
    const response = await api.get("/admin/announcements");
    return response.data;
  },

  // Update announcement
  updateAnnouncement: async (announcementId, announcementData) => {
    const response = await api.patch(`/admin/announcements/${announcementId}`, announcementData);
    return response.data;
  },

  // Delete announcement
  deleteAnnouncement: async (announcementId) => {
    const response = await api.delete(`/admin/announcements/${announcementId}`);
    return response.data;
  },

  // Publish announcement
  publishAnnouncement: async (announcementId) => {
    const response = await api.patch(`/admin/announcements/${announcementId}/publish`);
    return response.data;
  },

  // Unpublish announcement
  unpublishAnnouncement: async (announcementId) => {
    const response = await api.patch(`/admin/announcements/${announcementId}/unpublish`);
    return response.data;
  },
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  // Create notification
  createNotification: async (notificationData) => {
    const response = await api.post("/admin/notifications", notificationData);
    return response.data;
  },

  // Get notification history
  getNotificationHistory: async () => {
    const response = await api.get("/admin/notifications");
    return response.data;
  },

  // Send notification
  sendNotification: async (notificationId) => {
    const response = await api.patch(`/admin/notifications/${notificationId}/send`);
    return response.data;
  },

  // Update notification
  updateNotification: async (notificationId, data) => {
    const response = await api.put(`/admin/notifications/${notificationId}`, data);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/admin/notifications/${notificationId}`);
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await api.post(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllNotificationsAsRead: async () => {
    const response = await api.post("/admin/notifications/mark-all-read");
    return response.data;
  },
};

// ==================== REPORTS & ATTENDANCE API ====================
export const reportsAPI = {
  // Get school reports (aggregated dashboard data)
  getSchoolReports: async () => {
    const response = await api.get("/admin/reports");
    return response.data;
  },

  // Get attendance records
  getAttendance: async (params) => {
    const response = await api.get("/admin/attendance", { params });
    return response.data;
  },
};

// ==================== COMBINED EXPORT (Optional) ====================
const schoolAPI = {
  ...schoolProfileAPI,
  ...teacherAPI,
  ...studentAPI,
  ...classAPI,
  ...classArmAPI,
  ...subjectAPI,
  ...sessionAPI,
  ...termAPI,
  ...feeAPI,
  ...paymentAPI,
  ...walletAPI,
  ...analyticsAPI,
  ...timetableAPI,
  ...resultApprovalAPI,
  ...announcementAPI,
  ...notificationAPI,
  ...reportsAPI,
};

export default schoolAPI;