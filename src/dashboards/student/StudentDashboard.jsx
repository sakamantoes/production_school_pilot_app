import { motion } from "framer-motion";
import { Award, Clock, TrendingUp, CreditCard, Calendar, BookOpen } from "lucide-react";

const StudentDashboard = () => {
  const stats = [
    { title: "Average Grade", value: "85%", icon: Award, color: "blue" },
    { title: "Attendance", value: "92%", icon: TrendingUp, color: "green" },
    { title: "Classes Today", value: "6", icon: Clock, color: "purple" },
    { title: "Pending Fees", value: "$0", icon: CreditCard, color: "orange" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;