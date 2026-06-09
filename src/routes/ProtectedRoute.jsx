// routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is trying to access the wrong dashboard
  const pathname = location.pathname;
  const userRole = user?.role?.toLowerCase();
  
  // Define allowed paths for each role
  const rolePathMap = {
    super_admin: '/super-admin',
    school_admin: '/school-admin',
    teacher: '/teacher',
    student: '/student',
  };

  const allowedPathPrefix = rolePathMap[userRole];
  
  // If user is trying to access a path that doesn't match their role prefix
  if (allowedPathPrefix && !pathname.startsWith(allowedPathPrefix)) {
    // Redirect to their role-specific dashboard
    const dashboardPath = 
      userRole === 'super_admin' ? '/super-admin/dashboard' :
      userRole === 'school_admin' ? '/school-admin/dashboard' :
      userRole === 'teacher' ? '/teacher/dashboard' :
      userRole === 'student' ? '/student/dashboard'  
      : '/'; // fallback to home if role is unknown
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;