// routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

/* Public Pages */
import NotFound from "../pages/NotFound";
import Home from "../pages/Home";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../routes/ProtectedRoute";

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
      
      {/* Protected Routes - Add when you have dashboard/waitlist */}
      <Route element={<ProtectedRoute />}>
        <Route path="/waitlist" element={<div>Waitlist Page</div>} />
      </Route>

      {/* 404 PAGE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;