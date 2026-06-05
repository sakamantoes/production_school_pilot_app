// src/pages/super-admin/SuperAdminDashboard.jsx
import { motion } from "framer-motion";
import { Users, Building, Activity, TrendingUp, Shield, Clock } from "lucide-react";

const SuperAdminDashboard = () => {
  const stats = [
    { title: "Total Schools", value: "24", icon: Building, color: "blue", change: "+12%" },
    { title: "Total Users", value: "1,234", icon: Users, color: "green", change: "+8%" },
    { title: "Active Subscriptions", value: "18", icon: Activity, color: "purple", change: "+5%" },
    { title: "Pending Approvals", value: "6", icon: Shield, color: "orange", change: "-2%" },
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
                <p className={`text-xs mt-2 ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
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

export default SuperAdminDashboard;