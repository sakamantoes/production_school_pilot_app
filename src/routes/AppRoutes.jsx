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
import SuperAdminDashboard from "../dashboards/super-admin/SuperAdminDashboard";
import SchoolAdminDashboard from "../dashboards/school-admin/SchoolAdminDashboard";
import TeacherDashboard from "../dashboards/teacher/TeacherDashboard";
import StudentDashboard from "../dashboards/student/StudentDashboard";
import SchoolAdminProfile from "../dashboards/school-admin/SchoolAdminProfile";
import CreateStudentAdmin from "../dashboards/school-admin/CreateStudentAdmin";
import CreateTeacherAdmin from "../dashboards/school-admin/CreateTeacherAdmin";
import AcademicManagement from "../dashboards/school-admin/AcademicManagement";
import TeacherDetail from "../dashboards/school-admin/TeacherDetail";
import StudentDetail from "../dashboards/school-admin/StudentDetail";

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

  <Route path="/school-admin" element={<DashboardLayout />}>
    <Route index element={<SchoolAdminDashboard />} />
    <Route path="dashboard" element={<SchoolAdminDashboard />} />
     <Route path="profile" element={<SchoolAdminProfile />} />
     <Route path="student-management" element={<CreateStudentAdmin />} />
     <Route path="teachers-management" element={<CreateTeacherAdmin />} />
     <Route path="academic-management" element={<AcademicManagement />} />
      <Route path="teachers /:id" element={<TeacherDetail />} />
       <Route path="students/:id" element={<StudentDetail />} />
  </Route>

  <Route path="/teacher" element={<DashboardLayout />}>
    <Route index element={<TeacherDashboard />} />
    <Route path="dashboard" element={<TeacherDashboard />} />
  </Route>

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