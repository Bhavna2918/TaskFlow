import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ToastProvider } from './context/ToastContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Inbox from './pages/Inbox';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Team from './pages/Team';
import Profile from './pages/Profile';
import Projects from './pages/Projects';

// Shared Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Protected Route Guard with Role checking
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'manager' | 'employee')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { currentUser, loading, initialized } = useAuthStore();
  
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#0e172e] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />; // Redirect to dashboard if unauthorized
  }

  return <>{children}</>;
};

// Main Layout Wrapper
interface AppLayoutProps {
  theme: string;
  setTheme: (theme: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ theme, setTheme, searchQuery, setSearchQuery }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0b1329] transition-colors duration-300">
      {/* Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Panel Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          setTheme={setTheme}
        />

        {/* Scrollable Main Views */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 dark:bg-[#0b1329]/10">
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} />} />
            <Route path="/tasks" element={<Tasks searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/calendar" element={<Calendar />} />
            
            {/* Restricted pages */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <Reports theme={theme} />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/team" element={<Team />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const { checkSession, initialized } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Detect theme preference or fallback to dark mode default
    const savedTheme = localStorage.getItem('tasksync_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0e172e] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastProvider>
        <Routes>
          {/* Standalone Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Application Routes Layout */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  theme={theme} 
                  setTheme={setTheme} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
