import React from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  GraduationCap, 
  BookOpen, 
  MessageSquare,
  Trophy,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Features = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const featuresData = [
    {
      icon: Users,
      title: "Student Management",
      description: "Organize student data, monitor progress, and manage records in one place.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      stats: "10K+ Students",
      delay: 0.1
    },
    {
      icon: CalendarCheck,
      title: "Attendance Tracking",
      description: "Track daily attendance and generate accurate reports instantly.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      stats: "99.9% Accuracy",
      delay: 0.15
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Analyze results and make better academic decisions using insights.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      stats: "Real-time Data",
      delay: 0.2
    },
    {
      icon: GraduationCap,
      title: "Curriculum Planning",
      description: "Design and manage curriculum with flexible lesson planning tools.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      stats: "Customizable",
      delay: 0.25
    },
    {
      icon: MessageSquare,
      title: "Parent Communication",
      description: "Keep parents informed with instant updates and messaging system.",
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      stats: "24/7 Access",
      delay: 0.3
    },
    {
      icon: Trophy,
      title: "Rewards & Recognition",
      description: "Motivate students with achievement tracking and reward systems.",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      stats: "Gamified",
      delay: 0.35
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.6,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.5,
      },
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const iconVariants = {
    hover: {
      rotate: [0, -10, 10, -5, 5, 0],
      scale: 1.1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  return (
    <section id="why-us" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-white to-gray-0">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
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
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"
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
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-200/20 to-yellow-200/20 rounded-full blur-3xl"
        />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full px-4 py-2 mb-4"
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Powerful Features</span>
          </motion.div>
          
          <motion.h1
            variants={headerVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          >
            Everything You Need
          </motion.h1>
          
          <motion.p
            variants={headerVariants}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Run a modern school efficiently with our comprehensive suite of tools
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {featuresData.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              custom={feature.delay}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Animated gradient border */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                style={{ borderRadius: '1rem', padding: '2px' }}
                initial={false}
              />
              
              <div className="relative bg-white rounded-2xl p-6 md:p-8 h-full">
                {/* Icon Container */}
                <motion.div
                  variants={iconVariants}
                  whileHover="hover"
                  className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Stats Badge */}
                <motion.div
                  variants={statVariants}
                  className="inline-flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">{feature.stats}</span>
                </motion.div>

                {/* Learn More Link */}
                <motion.a
                  href="#"
                  className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ x: 5 }}
                >
                  Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 md:mt-20 text-center"
        >
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl p-8 md:p-10 border border-amber-100 shadow-sm">
  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
    <div className="text-center md:text-left">
      <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-3 py-1 mb-3">
        <span className="text-amber-700 text-xs font-medium">Limited spots</span>
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
        Ready to make the switch?
      </h3>
      <p className="text-gray-600">
        No pressure. No hidden fees. Just register your school and we'll get in touch.
      </p>
    </div>
    <Link to='/register'> <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 group"
    >
      Click to Start
       
      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button></Link>
   
  </div>
</div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-5 top-1/3 opacity-20 hidden lg:block"
        >
          <Clock className="w-16 h-16 text-gray-400" />
        </motion.div>
        
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-5 bottom-1/3 opacity-20 hidden lg:block"
        >
          <Award className="w-20 h-20 text-gray-400" />
        </motion.div>
      </div>
    </section>
  );
};

export default Features;