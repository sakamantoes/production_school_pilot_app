import React from "react";
import { motion, useInView } from "framer-motion";
import {
  Target,
  Eye,
  Heart,
  Lightbulb,
  ShieldCheck,
  Users2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Image from "../../assets/image";

const About = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const [counts, setCounts] = React.useState({
    years: 0,
    schools: 0,
    satisfaction: 0,
    support: 0,
  });

  React.useEffect(() => {
    if (isInView) {
      // Random count animation for years (8+)
      const yearsInterval = setInterval(() => {
        setCounts((prev) => {
          const random = Math.floor(Math.random() * 9);
          if (prev.years >= 8) {
            clearInterval(yearsInterval);
            return { ...prev, years: 8 };
          }
          return { ...prev, years: random };
        });
      }, 80);

      // Random count animation for schools (500+)
      const schoolsInterval = setInterval(() => {
        setCounts((prev) => {
          const random = Math.floor(Math.random() * 510);
          if (prev.schools >= 500) {
            clearInterval(schoolsInterval);
            return { ...prev, schools: 500 };
          }
          return { ...prev, schools: random };
        });
      }, 15);

      // Random count animation for satisfaction (98%)
      const satisfactionInterval = setInterval(() => {
        setCounts((prev) => {
          const random = Math.floor(Math.random() * 99);
          if (prev.satisfaction >= 98) {
            clearInterval(satisfactionInterval);
            return { ...prev, satisfaction: 98 };
          }
          return { ...prev, satisfaction: random };
        });
      }, 50);

      // Random count animation for support (24/7)
      const supportInterval = setInterval(() => {
        setCounts((prev) => {
          const random = Math.floor(Math.random() * 25);
          if (prev.support >= 24) {
            clearInterval(supportInterval);
            return { ...prev, support: 24 };
          }
          return { ...prev, support: random };
        });
      }, 60);

      return () => {
        clearInterval(yearsInterval);
        clearInterval(schoolsInterval);
        clearInterval(satisfactionInterval);
        clearInterval(supportInterval);
      };
    }
  }, [isInView]);

  const stats = [
    { value: counts.years + "+", label: "Years Experience", icon: TrendingUp },
    { value: counts.schools + "+", label: "Schools Using", icon: Users2 },
    {
      value: counts.satisfaction + "%",
      label: "Parent Satisfaction",
      icon: Heart,
    },
    {
      value: counts.support + "/7",
      label: "Support Available",
      icon: ShieldCheck,
    },
  ];

  const values =  [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To simplify school management through smart technology that actually works for everyone involved.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Eye,
      title: "Our Vision",
      description:
        "A future where every school, no matter the size, has access to tools that make administration effortless.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Heart,
      title: "Our Values",
      description:
        "Built on trust, transparency, and a genuine desire to help educators focus on what matters most — teaching.",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  const milestones = [
    {
      year: "April 24, 2025",
      event: "SchoolPilot began as a class project focused on improving school administration through technology",
      active: false,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-600",
    },
    {
      year: "Mid 2025",
      event: "A core team was formed and the vision, mission, and purpose of the platform were established ",
      active: false,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-600",
    },
    {
      year: "November 2025",
      event: "School Pilot secured its CAC and SMEDAN registrations, becoming a legally recognized business",
      active: false,
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-600",
    },
    {
      year: "March 2026",
      event: "Official business account details and operational structures were set up",
      active: true,
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-600",
    },
    {
      year: "April 2026",
      event: "The platform began its first testing phase with school Pilot",
      active: true,
      color: "bg-red-30 border-red-200",
      textColor: "text-red-600",
    },
    {
      year: "Present Day",
      event: "School Pilot now has a team of six members and active social media platforms, and is continuing development toward full deployment in school",
      active: true,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section id="about" ref={ref} className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Behind the platform</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Built by educators,
            <br />
            for educators
          </h2>
          <p className="text-gray-600 text-lg">
            We started SchoolPilot because we saw firsthand how administrative
            work was taking teachers away from students.
          </p>
        </motion.div>

        {/* Main story section - two column layout */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Left - Image placeholder */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src={Image.hero}
                alt="Team collaboration"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active users</p>
                <p className="font-bold text-gray-900">50,000+</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Story text */}
          <motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  className="space-y-6"
>
  <motion.p
    variants={fadeUp}
    className="text-gray-700 leading-relaxed"
  >
    My journey with School Pilot began from a deep frustration with how many schools operate. I noticed outdated, manual systems that made administration slow, stressful, and prone to errors. Instead of focusing on education, school leaders were stuck managing inefficiencies.
  </motion.p>

  <motion.p
    variants={fadeUp}
    className="text-gray-700 leading-relaxed"
  >
    As an educationist from Alvan Ikoku Federal University of Education, Owerri, and a certified prompt engineer, I saw how technology could transform these challenges. I realized that improving education is not just about teaching—it’s about building smarter systems.
  </motion.p>

  <motion.p
    variants={fadeUp}
    className="text-gray-700 leading-relaxed"
  >
    That vision led to School Pilot—a system designed to simplify administration, improve communication, and give schools full control. It helps schools spend less time on processes and more time delivering quality education. This is more than software—it’s a smarter way to run schools.
  </motion.p>

  <motion.div variants={fadeUp} className="pt-4">
    <div className="flex items-center gap-2 text-blue-600 font-medium">
      <span>Abel Marvelous, Founder & CEO</span>
      <div className="w-12 h-px bg-blue-200"></div>
    </div>
  </motion.div>
</motion.div>
        </div>

        {/* Values section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-24"
        >
          {values.map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              className="bg-gray-50 rounded-xl p-6 transition-all duration-300"
            >
              <div
                className={`${item.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24"
        >
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={scaleIn} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Journey timeline */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="bg-gray-50 rounded-2xl p-8 md:p-10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Our journey so far
            </h3>
            <p className="text-gray-500 mt-1">
              From a small idea to a growing community
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gray-300 md:-translate-x-px"></div>

            <div className="space-y-8">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="flex-1 md:w-1/2"></div>

                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 mx-4 md:mx-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                    <div
                      className={`w-4 h-4 rounded-full ${milestone.active ? "bg-blue-600 ring-4 ring-blue-200" : "bg-gray-400"}`}
                    ></div>
                  </div>

                  {/* Content with different light colors */}
                  <div
                    className={`flex-1 md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}
                  >
                    <div
                      className={`${milestone.color} rounded-lg p-4 shadow-sm border`}
                    >
                      <span
                        className={`text-sm font-bold ${milestone.textColor}`}
                      >
                        {milestone.year}
                      </span>
                      <p className="text-gray-800 mt-1">{milestone.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom note - human touch */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gray-100 rounded-full px-6 py-3">
            <p className="text-gray-700 text-sm">
              <span className="font-medium">Want to know more?</span> We'd love
              to chat.
              <a href="#contact" className="text-blue-600 hover:underline ml-1">
                Get in touch →
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
