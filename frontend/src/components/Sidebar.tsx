import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, MessageSquare, Calendar, 
  BarChart2, Users, User, LogOut, Shield, ChevronLeft, ChevronRight, Command, Folder
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import api from '../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Poll for messages to update the inbox unread badge count
  const fetchUnreadMessages = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get('/messages');
      const messages = res.data;
      
      const received = messages.filter((m: any) => m.receiverId === currentUser.id);
      const readMsgIds = JSON.parse(localStorage.getItem('tasksync_read_msg_ids') || '[]');
      const unread = received.filter((m: any) => !readMsgIds.includes(m.id)).length;
      
      setUnreadMsgCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Folder },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Inbox', path: '/inbox', icon: MessageSquare, badge: unreadMsgCount },
    { name: 'Calendar', path: '/calendar', icon: Calendar }
  ];

  if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
    navItems.push({ name: 'Reports', path: '/reports', icon: BarChart2 });
  }

  navItems.push(
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Profile', path: '/profile', icon: User }
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b0f19] border-r border-white/5 text-white transform lg:translate-x-0 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[70px]' : 'lg:w-[220px]'} lg:static lg:z-0 shrink-0`}
      >
        {/* Brand Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 relative">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-neon-glow shrink-0">
              <Command className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                  TaskFlow
                </span>
                <span className="block text-[8px] uppercase tracking-widest text-indigo-400 font-bold -mt-0.5">
                  Enterprise OS
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-5 w-6 h-6 rounded-full border border-white/5 bg-[#0b0f19] hover:bg-white/5 items-center justify-center text-gray-400 hover:text-white transition-all z-50 shadow-md"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Card (Sidebar top) */}
        {!isCollapsed ? (
          <div className="p-3.5 mx-4 mt-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="relative shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm uppercase">
                  {currentUser?.name ? currentUser.name.charAt(0) : '?'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b0f19]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold truncate text-gray-200">{currentUser?.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="text-[10px] text-gray-400 capitalize truncate">{currentUser?.role}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <div className="relative">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
                  {currentUser?.name ? currentUser.name.charAt(0) : '?'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b0f19]"></span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border-l-4 border-indigo-500 text-white shadow-neon-glow'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-105 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500 text-white rounded-full ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out at the Bottom */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-all duration-200"
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
