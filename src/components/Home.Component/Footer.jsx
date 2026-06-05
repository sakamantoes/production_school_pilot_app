import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Send } from 'lucide-react';
import Image from '../../assets/image';

const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const linkVariants = {
    hover: { x: 5, color: "#2104FF", transition: { duration: 0.2 } }
  };

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={footerVariants}
      className="relative bg-gray-900 text-gray-300 pt-16 pb-8 overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-white to-indigo-200 rounded-lg flex items-center justify-center">
                <img src={Image.Logo} alt="" />
              </div>
              <span className="text-white font-bold text-xl">SchoolPilot</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Simplifying school management for educators, students, and parents. 
              One platform to handle everything from attendance to analytics.
            </p>
            <div className="flex gap-3">
              <motion.a
                whileHover={{ y: -3, color: "#3b82f6" }}
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ y: -3, color: "#3b82f6" }}
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Twitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ y: -3, color: "#3b82f6" }}
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ y: -3, color: "#3b82f6" }}
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Instagram className="w-4 h-4" />
              </motion.a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Demo', 'Integrations', 'Updates'].map((item) => (
                <motion.li key={item} variants={linkVariants} whileHover="hover">
                  <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Blog', 'Press', 'Contact'].map((item) => (
                <motion.li key={item} variants={linkVariants} whileHover="hover">
                  <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <span>Schoolpilotedu@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>123 Education St, Suite 100<br />San Francisco, CA 94105</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter section */}
        <div className="py-8 border-b border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-white font-semibold text-lg mb-1">Stay in the loop</h3>
              <p className="text-gray-400 text-sm">
                Get the latest updates, tips, and resources for school management.
              </p>
            </div>
            <div className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-indigo-500 to-[#214f77] hover:from-blue-700 hover:to-indigo-700 px-3 py-3 rounded-r-lg text-white font-medium flex items-center gap-2 transition"
              >
                Subscribe
                {/* <Send className="w-4 h-4" /> */}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
          <p className="text-gray-500 text-sm text-center">
            © 2025 SchoolPilot. All rights reserved. Made by School Pilot dev for educators.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-gray-400 transition">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 transition">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-gray-400 transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;