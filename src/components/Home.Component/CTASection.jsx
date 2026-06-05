import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection = () => {
  const features = [
    "No credit card required",
    "Cancel anytime"
  ];

  // Store the primary color for reuse
  const primaryColor = "hsl(219.2deg 80.73% 42.75%)";

  return (
    <section id='CTASection' className="relative py-20 md:py-28 overflow-hidden">
      {/* Gradient Background using the specified color */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[hsl(219.2deg_80.73%_42.75%)] via-[hsl(219.2deg_80.73%_42.75%)] to-indigo-900"
      />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Small badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-sm font-medium text-white/90">Get started today</span>
        </motion.div>

        {/* Main heading - BOLD and centered */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
        >
          Ready to Transform Your School?
        </motion.h2>

        {/* Subheading - centered */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
        >
          Join schools already using SchoolPilot to simplify management and improve results
        </motion.p>

        {/* CTA Button */}
        <Link to="/register">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group bg-white text-[#214f77] px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2"
            >
              Create your account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </Link>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
        >
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-300" />
              <span className="text-sm text-blue-100">{feature}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;