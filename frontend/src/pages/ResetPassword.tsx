import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../context/ToastContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, Command } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast('Please fill in all fields', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'warning');
      return;
    }

    if (!token) {
      toast('Reset token is missing', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      toast('Password updated successfully! Logged in.', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message || 'Reset password failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full filter blur-[90px]"></div>

      <div 
        className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0f1424]/85 text-white p-8 relative z-10 shadow-2xl"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create New Password</h2>
          <p className="text-xs text-gray-400 mt-1">Enter your new secure password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
