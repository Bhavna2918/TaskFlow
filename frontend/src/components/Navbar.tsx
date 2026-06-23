import React, { useState } from 'react';
import { Search, Sun, Moon, LogOut, User, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import NotificationCenter from './NotificationCenter';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onMenuToggle, 
  searchQuery, 
  setSearchQuery, 
  theme, 
  setTheme 
}) => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tasksync_theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('tasksync_theme', 'dark');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-gray-200 dark:border-white/5 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md flex items-center justify-between px-6 transition-colors duration-300">
      
      {/* Search Bar / Hamburger Menu Trigger */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Hamburger Trigger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Live Search Bar */}
        <div className="relative max-w-xs w-full hidden md:block group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 transition-colors group-focus-within:text-indigo-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search tasks, team, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs transition-all duration-300 transform focus:scale-[1.01]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navbar Actions (Right Side) */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300 border border-transparent dark:hover:border-white/10 focus:outline-none"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <NotificationCenter currentUser={currentUser} />

        {/* Divider */}
        <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 hidden sm:block"></div>

        {/* Profile Card & Badges */}
        <div className="relative flex items-center gap-3">
          {/* User Details (Desktop only) */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">
              {currentUser?.name}
            </p>
            <span
              className={`inline-block text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full mt-1 ${
                currentUser?.role === 'admin'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20'
                  : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-500/20'
              }`}
            >
              {currentUser?.role}
            </span>
          </div>

          {/* Profile Dropdown Toggle */}
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden focus:outline-none ring-2 ring-gray-100 dark:ring-white/5 hover:ring-indigo-500/50 transition-all duration-300 shrink-0"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm uppercase">
                {currentUser?.name ? currentUser.name.charAt(0) : '?'}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 top-12 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0f1424] border border-gray-250 dark:border-white/10 shadow-2xl p-2 z-50 text-left transition-all duration-300">
                <button
                  onClick={() => { navigate('/profile'); setProfileDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-250 hover:bg-gray-150 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </button>
                <button
                  onClick={() => { navigate('/profile'); setProfileDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-250 hover:bg-gray-150 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-400" />
                  Settings
                </button>
                <hr className="my-1.5 border-gray-200 dark:border-white/5" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
