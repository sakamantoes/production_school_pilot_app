// routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

/* Public Pages */
import NotFound from "../pages/NotFound";
import Home from "../pages/Home";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../routes/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

/* Dashboards for all roles */
// Super Admin
import SuperAdminDashboard from "../dashboards/super-admin/SuperAdminDashboard";

// School Admin
import SchoolAdminDashboard from "../dashboards/school-admin/SchoolAdminDashboard";
import SchoolAdminProfile from "../dashboards/school-admin/SchoolAdminProfile";
import CreateStudentAdmin from "../dashboards/school-admin/CreateStudentAdmin";
import CreateTeacherAdmin from "../dashboards/school-admin/CreateTeacherAdmin";
import AcademicManagement from "../dashboards/school-admin/AcademicManagement";
import TeacherDetail from "../dashboards/school-admin/TeacherDetail";
import StudentDetail from "../dashboards/school-admin/StudentDetail";
import FeeManagement from "../dashboards/school-admin/FeeManagement";
import AnalyticsDashboard from "../dashboards/school-admin/AnalyticsDashboard";
import TimetableManager from "../dashboards/school-admin/TimetableManager";
import ResultApproval from "../dashboards/school-admin/ResultApproval";
import AnnouncementsAdmin from "../dashboards/school-admin/AnnouncementsAdmin";
import AttendanceReport from "../dashboards/school-admin/AttendanceReport";
import CreateNotification from "../dashboards/school-admin/CreateNotification";

// Teacher
import TeacherDashboard from "../dashboards/teacher/TeacherDashboard";
import TeacherResultUpload from "../dashboards/teacher/TeacherResultUpload";
import TeacherUploadStatus from "../dashboards/teacher/TeacherUploadStatus";
import TeacherTimeTable from "../dashboards/teacher/TeacherTimeTable";
import TeacherAttendance from '../dashboards/teacher/TeaccherAttendance'
import TeacherAttendanceVeiw from "../dashboards/teacher/TeacherAttendanceVeiw";
import TeacherAnnouncements from "../dashboards/teacher/TeacherAnnouncements";
import TeacherClassManagement from "../dashboards/teacher/TeacherClassManagement";
import TeacherProfile from "../dashboards/teacher/TeacherProfile";

// Student
import StudentDashboard from "../dashboards/student/StudentDashboard";



const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />

      {/* Auth Routes (with AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/super-admin" element={<DashboardLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* SCHOOL ADMIN */}
        <Route path="/school-admin" element={<DashboardLayout />}>
          <Route index element={<SchoolAdminDashboard />} />
          <Route path="dashboard" element={<SchoolAdminDashboard />} />
          <Route path="profile" element={<SchoolAdminProfile />} />
          <Route path="student-management" element={<CreateStudentAdmin />} />
          <Route path="teachers-management" element={<CreateTeacherAdmin />} />
          <Route path="academic-management" element={<AcademicManagement />} />
          <Route path="teachers/:id" element={<TeacherDetail />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="fees" element={<FeeManagement />} />
          <Route path="reports" element={<AnalyticsDashboard />} />
          <Route path="timetable" element={<TimetableManager />} />
          <Route path="result-approval" element={<ResultApproval />} />
          <Route
            path="announcements-Management"
            element={<AnnouncementsAdmin />}
          />
          <Route
            path="notifications-Management"
            element={<CreateNotification />}
          />
          <Route path="attendance-report" element={<AttendanceReport />} />
        </Route>

        {/* TEACHER DASHBOARD */}
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="Upload-results" element={<TeacherResultUpload />} />
          <Route path="Result-Status" element={<TeacherUploadStatus />} />
          <Route path="timetable" element={<TeacherTimeTable />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="attendance/view-attendance" element={<TeacherAttendanceVeiw />} />
          <Route path='announcements' element={<TeacherAnnouncements />} />
          <Route path='class-management' element={<TeacherClassManagement />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>

        {/* STUDENT DASHBOARD */}
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>
      </Route>

      {/* 404 PAGE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
