import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Add error handling - check if context is available
  let notificationContext;
  try {
    notificationContext = useNotification();
  } catch (error) {
    console.error('NotificationBell must be used within NotificationProvider:', error);
    notificationContext = null;
  }
  
  // If context is not available, return a fallback UI or null
  if (!notificationContext) {
    console.warn('NotificationBell rendered outside NotificationProvider');
    return (
      <button
        className="
          relative p-2 rounded-xl
          bg-gradient-to-r from-primary-50/50 to-primary-100/20
          border border-gray-500
          transition-all duration-200
        "
      >
        <Bell className="w-5 h-5 text-primary-600" />
      </button>
    );
  }
  
  const { notifications, unreadCount, markAsRead } = notificationContext;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative p-2 rounded-xl
          bg-gradient-to-r from-primary-50/50 to-primary-100/20
          hover:from-primary-100 hover:to-primary-200
          border border-gray-500
          transition-all duration-200
        "
      >
        <Bell className="w-5 h-5 text-primary-600" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="
              absolute -top-1 -right-1 w-5 h-5
              bg-gradient-to-br from-red-500 to-red-600
              text-white text-xs rounded-full
              flex items-center justify-center
              shadow-lg shadow-red-500/30
            "
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="
              absolute right-0 mt-2 w-80
              bg-gradient-to-b from-white via-white to-primary-50/30
              rounded-xl shadow-xl shadow-primary-500/10
              border border-primary-100/50
              backdrop-blur-sm backdrop-filter
              z-50 overflow-hidden
            "
          >
            {/* Header */}
            <div className="
              p-4 border-b border-primary-100/50
              bg-gradient-to-r from-primary-500/5 to-transparent
            ">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="
                    w-8 h-8 rounded-lg
                    bg-gradient-to-br from-primary-500 to-primary-600
                    flex items-center justify-center
                  ">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="
                      px-2 py-1 bg-primary-100 text-primary-700
                      text-xs font-medium rounded-full
                    ">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead('all')}
                    className="
                      text-sm font-medium text-primary-600
                      hover:text-primary-700
                      transition-colors duration-200
                    "
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="
                    w-16 h-16 mx-auto mb-4
                    bg-gradient-to-br from-primary-100 to-primary-200
                    rounded-full flex items-center justify-center
                  ">
                    <Bell className="w-8 h-8 text-primary-500" />
                  </div>
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    All caught up!
                  </p>
                </div>
              ) : (
                notifications.slice(0, 5).map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
                      p-4 border-b border-primary-100/30
                      transition-all duration-200
                      hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-primary-100/20
                      cursor-pointer
                      ${!notification.read ? 'bg-gradient-to-r from-primary-50/30 to-primary-100/10' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="
                        w-10 h-10 rounded-lg
                        bg-gradient-to-br from-primary-100 to-primary-200
                        flex items-center justify-center flex-shrink-0
                      ">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-primary-600 mt-1">
                          {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true
                          }) : 'Just now'}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="
                          w-2 h-2
                          bg-gradient-to-br from-primary-500 to-primary-600
                          rounded-full flex-shrink-0 mt-2
                        "/>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
              <div className="
                p-3 border-t border-primary-100/50
                bg-gradient-to-r from-primary-50/20 to-transparent
              ">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="
                    block text-center text-sm font-medium text-primary-600
                    hover:text-primary-700
                    transition-colors duration-200
                  "
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;