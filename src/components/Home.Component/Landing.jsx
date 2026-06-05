import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BarChart3, Calendar, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Image from '../../assets/image';

const Landing = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, x: 100 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20,
        delay: 0.3,
      },
    },
  };

  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 10px 30px rgba(255, 255, 255, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: { scale: 0.95 },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    }),
  };

  const badgeVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.2 },
    },
    hover: {
      scale: 1.05,
      backgroundColor: "#ffffff",
      transition: { duration: 0.3 },
    },
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-12">
      {/* Animated Background Gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
          className="absolute inset-0 Base"
      />
      
      {/* Animated Background Patterns */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            y: [null, -30, 30, -30],
            x: [null, 20, -20, 20],
          }}
          transition={{
            duration: Math.random() * 10 + 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Trust Badge */}
            <motion.div
              variants={badgeVariants}
              whileHover="hover"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white/90 text-sm font-medium">
                Trusted by 500+ Schools
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 leading-tight"
            >
              Smart School
              <span className="block mt-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Management Starts Here
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-[15px] text-white/90 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              SchoolPilot is designed to help schools manage students, track
              performance, monitor attendance, and streamline administrative work  
              all from one powerful platform.
            </motion.p>

          

<motion.p
  initial={{ opacity: 0, y: 20 }}
  animate={{ 
    opacity: 1, 
    y: 0,
    scale: [1, 1.02, 1],
  }}
  transition={{ 
    duration: 0.6, 
    ease: [0.25, 0.1, 0.25, 1],
    scale: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }}
  className="text-white/90 mb-8 max-w-lg mx-auto lg:mx-0 text-lg font-semibold tracking-wide"
>
  CLICK THE BUTTON BELOW TO REGISTER AND JOIN OUR WAITLIST
</motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex sm:justify-start justify-center mb-12"
            >
              <Link to='/register'> <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="group bg-white text-[#214f77] px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
</Link>
             
            </motion.div>

            {/* Stats Section */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-white/20"
            >
              {[
                { number: "500+", label: "Schools", icon: GraduationCap },
                { number: "50K+", label: "Students", icon: Users },
                { number: "99.9%", label: "Uptime", icon: Zap },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={statsVariants}
                  className="text-center"
                >
                  <stat.icon className="w-6 h-6 text-white/70 mx-auto mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            variants={imageVariants}
            animate="visible"
            className="relative"
          >
            {/* Floating elements around image */}
            <motion.div
              animate={floatingAnimation}
              className="absolute -top-4 -left-10 bg-white/10 backdrop-blur-sm rounded-2xl p-3 hidden lg:block"
            >
              <BarChart3 className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              animate={{
                y: [0, -15, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-8 -right-8 bg-white/10 backdrop-blur-sm rounded-2xl p-3 hidden lg:block"
            >
              <Calendar className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              animate={{
                y: [0, 15, 0],
                x: [0, -10, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 -right-12 bg-white/10 backdrop-blur-sm rounded-2xl p-3 hidden lg:block"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>

            {/* Main Image Card */}
            <motion.div
              whileHover={{ scale: 1.02, rotate: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2104FF]/20 to-transparent pointer-events-none" />
              <img
                src={Image.other}
                alt="School Management Dashboard"
                className="w-full h-auto rounded-2xl relative z-0"
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl" />
            </motion.div>

            {/* Floating notification card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 min-w-[250px]"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">New enrollment</p>
                <p className="text-sm font-semibold text-gray-800">+24 students joined today</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-sm">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Landing;