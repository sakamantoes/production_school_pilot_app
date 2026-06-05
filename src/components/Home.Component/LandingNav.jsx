// components/Home.Component/LandingNav.jsx
import React, { useState, useEffect } from "react";
import Image from "../../assets/image";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDashboardClick = () => {
    if (user) {
      const dashboardPath = getRoleDashboardPath(user.role);
      navigate(dashboardPath);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Animation variants (keep your existing variants)
  const navVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: 0.2,
      },
    },
    scrolled: {
      background: "rgba(255, 255, 255)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      color: "rgba(255, 255, 255, 0.95)",
    },
    default: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(0px)",
      boxShadow: "none",
    },
  };

  const logoVariants = {
    hover: {
      scale: 1.05,
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    tap: { scale: 0.95 },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    }),
    hover: {
      scale: 1.1,
      color: "#2104FF",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: { scale: 0.95 },
  };

  const buttonVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.5 + i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    }),
    hover: () => ({
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(33, 4, 255, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    }),
    tap: { scale: 0.95 },
  };

  const mobileMenuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const mobileItemVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    },
    tap: { scale: 0.95 },
  };

  const hamburgerVariants = {
    initial: { rotate: 0 },
    animate: { rotate: 180 },
  };

  const lineVariants = {
    top: {
      closed: { rotate: 0, y: 0 },
      open: { rotate: 45, y: 8 },
    },
    middle: {
      closed: { opacity: 1 },
      open: { opacity: 0 },
    },
    bottom: {
      closed: { rotate: 0, y: 0 },
      open: { rotate: -45, y: -8 },
    },
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div>
      <motion.div
        variants={navVariants}
        initial="initial"
        animate={["animate", scrolled ? "scrolled" : "default"]}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="m-auto w-full lg:w-[1100px] px-4 lg:px-0 flex items-center justify-between py-2 lg:py-1">
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            whileHover="hover"
            whileTap="tap"
            className="flex"
          >
            <Link to="/">
              <motion.img
                src={Image.Logo}
                alt="company logo"
                className="w-[60px] lg:w-[80px] rounded-full cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation Options */}
          <div className="hidden md:block">
            <ul className="flex items-center gap-7">
              {["hero", "about", "why-us", "CTASection"].map((item, i) => (
                <motion.li
                  key={item}
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <a
                    href={`#${item}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item);
                    }}
                    className="text-gray-700 hover:text-[#214f77] transition-colors duration-200 Text font-medium cursor-pointer"
                  >
                    {item === "why-us"
                      ? "Why Us"
                      : item.charAt(0).toUpperCase() + item.slice(1)}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Desktop Auth Section - Conditional Rendering */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <motion.button
                  custom={0}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleDashboardClick}
                  className="Base text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all duration-300 Text shadow-lg"
                >
                  Dashboard
                </motion.button>
                <motion.button
                  custom={1}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleLogout}
                  className="border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <motion.button
                    custom={0}
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    className="Base text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all duration-300 Text shadow-lg"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    custom={1}
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    className="border-2 border-[#214f77] text-[#214f77] px-6 py-2.5 rounded-full hover:bg-[#214f77] hover:text-white transition-all duration-300"
                  >
                    Register
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.div
            className="md:hidden cursor-pointer z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            animate={mobileMenuOpen ? "open" : "closed"}
            variants={hamburgerVariants}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div className="w-8 h-6 relative flex flex-col justify-between">
              <motion.span
                variants={lineVariants.top}
                animate={mobileMenuOpen ? "open" : "closed"}
                className="w-full h-1 bg-[hsl(219.2deg_80.73%_42.75%)] rounded-full"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                variants={lineVariants.middle}
                animate={mobileMenuOpen ? "open" : "closed"}
                className="w-full h-1 bg-[hsl(219.2deg_80.73%_42.75%)] rounded-full"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                variants={lineVariants.bottom}
                animate={mobileMenuOpen ? "open" : "closed"}
                className="w-full h-1 bg-[hsl(219.2deg_80.73%_42.75%)] rounded-full"
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-40 md:hidden"
            >
              <div className="flex flex-col h-full pt-20 px-6">
                <div className="flex flex-col gap-6 mb-8">
                  {["hero", "about", "why-us", "CTASection"].map((item) => (
                    <motion.a
                      key={item}
                      variants={mobileItemVariants}
                      whileTap="tap"
                      href={`#${item}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item);
                      }}
                      className="text-gray-700 hover:text-[#214f77] text-lg font-medium py-2 border-b border-gray-100 transition-colors"
                    >
                      {item === "why-us"
                        ? "Why Us"
                        : item.charAt(0).toUpperCase() + item.slice(1)}
                    </motion.a>
                  ))}
                </div>
                <motion.div
                  variants={mobileItemVariants}
                  className="flex flex-col gap-3 mt-auto mb-8"
                >
                  {isAuthenticated ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDashboardClick}
                        className="bg-[hsl(219.2deg_80.73%_42.75%)] text-white px-6 py-3 rounded-full font-semibold w-full"
                      >
                        Dashboard
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="border-2 border-red-500 text-red-500 px-6 py-3 rounded-full font-semibold w-full"
                      >
                        Logout
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <Link to="/login">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-[hsl(219.2deg_80.73%_42.75%)] text-white px-6 py-3 rounded-full font-semibold w-full"
                        >
                          Login
                        </motion.button>
                      </Link>
                      <Link to="/register">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="border-2 border-[hsl(219.2deg_80.73%_42.75%)] text-[hsl(219.2deg_80.73%_42.75%)] px-6 py-3 rounded-full font-semibold w-full"
                        >
                          Register
                        </motion.button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingNav;