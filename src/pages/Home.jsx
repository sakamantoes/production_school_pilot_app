// pages/Home.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingNav from '../components/Home.Component/LandingNav';
import Landing from '../components/Home.Component/Landing';
import Features from '../components/Home.Component/Features';
import About from '../components/Home.Component/About';
import Testimonials from '../components/Home.Component/Testimonials';
import CTASection from '../components/Home.Component/CTASection';
import Footer from '../components/Home.Component/Footer';

const Home = () => {
  const { isAuthenticated, user, loading, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to their dashboard
    if (!loading && isAuthenticated && user) {
      const dashboardPath = getRoleDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, getRoleDashboardPath]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authenticated, don't render landing page (will redirect)
  if (isAuthenticated) {
    return null;
  }

  // Render full landing page content for non-authenticated users
  return (
    <div>
      <LandingNav />
      <Landing />
      <Features />
      <About />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;