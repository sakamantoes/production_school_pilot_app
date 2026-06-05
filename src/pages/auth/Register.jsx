import React from "react";
import RegisterAnimation from "../../components/Auth.Component/registerAnimation.jsx";
import Image from "../../assets/image.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden w-full">
      {/* Image section (desktop only) - full coverage */}
      <div className="hidden md:block md:w-1/2 relative h-full">
        {/* Arrow button - positioned on top of image */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/">
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-[hsl(219.2deg_80.73%_42.75%)] rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white font-bold" />
            </motion.button>
          </Link>
        </div>

        {/* Background Image */}
        <img
          src={Image.SideImage}
          alt="School Registration"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-1/2 overflow-y-auto bg-white">
        <div className="relative z-50 flex items-center justify-between px-4 py-4 md:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium relative z-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <RegisterAnimation />
      </div>
    </div>
  );
};

export default Register;
