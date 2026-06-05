import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  Sun,
  Moon,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import { AdminPanelSettings } from "@mui/icons-material";

const Navbar = ({ toggleSidebar, title, subtitle }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        bg-gradient-to-r from-white via-white to-primary-50/30
        shadow-sm border-b border-gray-300
         backdrop-filter
        px-4 py-3
        z-[60]
      "
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="
              lg:hidden p-2 rounded-xl
              bg-primary-50 text-primary-600
              hover:bg-primary-100
              transition-colors duration-200
            "
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title Section */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <AdminPanelSettings className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-primary-600 font-medium">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <div
              className="
              relative overflow-hidden rounded-xl
              bg-gradient-to-r from-primary-50/50 to-primary-100/20
              border border-gray-400
            "
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students, teachers, or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  pl-10 pr-4 py-2 bg-transparent
                  w-64 lg:w-80 xl:w-96
                  focus:outline-none focus:ring-0
                  text-gray-700 placeholder-primary-400
                "
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions */}

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="
                flex items-center space-x-3 p-2 rounded-xl
                bg-gradient-to-r from-primary-50/50 to-primary-100/20
                hover:from-primary-100 hover:to-primary-200
                border border-gray-300/100
                transition-all duration-200
                group
              "
            >
              <div className="relative">
                <div
                  className="
                  w-9 h-9 rounded-full
                  bg-gradient-to-br from-primary-200 to-primary-300
                  flex items-center justify-center
                  shadow-sm
                "
                >
                  <User className="w-5 h-5 text-primary-700" />
                </div>
                <div
                  className="
                  absolute -bottom-1 -right-1 w-3 h-3
                  bg-gradient-to-br from-green-400 to-green-500
                  rounded-full border-2 border-white
                "
                />
              </div>

              <div className="hidden md:block text-left">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-gray-900 max-w-[120px] truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <ChevronDown
                    className={`
                    w-4 h-4 text-primary-500
                    transition-transform duration-200
                    ${userMenuOpen ? "rotate-180" : ""}
                  `}
                  />
                </div>
                <p className="text-xs text-primary-600 font-medium capitalize">
                  {user?.role}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="
                  absolute right-0 mt-2 w-56
                  bg-gradient-to-b from-white via-white to-primary-50/30
                  rounded-xl shadow-xl shadow-primary-500/10
                  border border-primary-100/50
                  backdrop-blur-sm backdrop-filter
                  z-[70] overflow-hidden
                "
              >
                {/* User Info */}
                <div
                  className="
                  p-4 border-b border-primary-100/50
                  bg-gradient-to-r from-primary-500/5 to-transparent
                "
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div
                        className="
                        w-12 h-12 rounded-full
                        bg-gradient-to-br from-primary-200 to-primary-300
                        flex items-center justify-center
                      "
                      >
                        <User className="w-6 h-6 text-primary-700" />
                      </div>
                      <div
                        className="
                        absolute -bottom-1 -right-1 w-4 h-4
                        bg-gradient-to-br from-green-400 to-green-500
                        rounded-full border-2 border-white
                      "
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-primary-600 font-medium capitalize">
                        {user?.role}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="
                      flex items-center px-4 py-3
                      text-gray-700 hover:text-primary-600
                      hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-primary-100/20
                      transition-all duration-200
                    "
                  >
                    <User className="w-4 h-4 mr-3 text-primary-500" />
                    <span className="text-sm font-medium">My Profile</span>
                  </Link>

                  <Link
                    to="/account-settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="
                      flex items-center px-4 py-3
                      text-gray-700 hover:text-primary-600
                      hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-primary-100/20
                      transition-all duration-200
                    "
                  >
                    <Settings className="w-4 h-4 mr-3 text-primary-500" />
                    <span className="text-sm font-medium">
                      Account Settings
                    </span>
                  </Link>

                  <Link
                    to="/help"
                    onClick={() => setUserMenuOpen(false)}
                    className="
                      flex items-center px-4 py-3
                      text-gray-700 hover:text-primary-600
                      hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-primary-100/20
                      transition-all duration-200
                    "
                  >
                    <HelpCircle className="w-4 h-4 mr-3 text-primary-500" />
                    <span className="text-sm font-medium">Help & Support</span>
                  </Link>
                </div>

                <div
                  className="
                  border-t border-primary-100/50
                  bg-gradient-to-r from-red-50/30 to-transparent
                "
                >
                  <button
                    onClick={handleLogout}
                    className="
                      flex items-center w-full px-4 py-3
                      text-red-600 hover:text-red-700
                      hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/20
                      transition-all duration-200
                    "
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="mt-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2
              bg-gradient-to-r from-primary-50/50 to-primary-100/20
              border border-primary-100/50
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-primary-500/30
              text-gray-700 placeholder-primary-400
            "
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
