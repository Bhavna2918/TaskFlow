import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ShieldAlert, Award, Calendar, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore, NotificationItem } from '../store/useNotificationStore';

interface NotificationCenterProps {
  currentUser: any;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser }) => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser, fetchNotifications]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Award className="w-4 h-4 text-indigo-400" />;
      case 'deadline_near':
        return <Calendar className="w-4 h-4 text-red-500" />;
      case 'status_updated':
        return <RefreshCw className="w-4 h-4 text-cyan-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-emerald-500" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 focus:outline-none border border-transparent dark:hover:border-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] font-bold flex items-center justify-center bg-indigo-500 text-white rounded-full border border-[#0b0f19] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0f1424] text-white shadow-2xl z-50 border border-white/5 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Notifications</h3>
                <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread updates</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markAllAsRead()}
                  className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 rounded hover:bg-white/5 font-bold"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read All</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex px-3 pt-2 pb-1 gap-1 border-b border-white/5 bg-white/[0.02] overflow-x-auto">
              {['all', 'unread', 'task_assigned', 'deadline_near', 'announcement'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md capitalize whitespace-nowrap transition-colors ${
                    filter === t
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No notifications found
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 text-left transition-colors cursor-pointer hover:bg-white/5 flex gap-3 ${
                      !n.read ? 'bg-white/[0.01] border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-gray-500 shrink-0 ml-2">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 break-words">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
