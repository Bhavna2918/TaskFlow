import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Shield, Loader2, Command } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
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

    setIsLoading(true);

    try {
      await register(name, email, password, role, '');
      toast('Account registered successfully! Auto-logged in.', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full filter blur-[90px]"></div>

      {/* Main Glass Signup Card */}
      <div 
        className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0f1424]/85 text-white p-8 relative z-10 shadow-2xl transition-all duration-300"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="text-xs text-gray-400 mt-1">Get started with TaskFlow workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Password</label>
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
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Confirm Password</label>
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

          {/* Role selector dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Account Role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Shield className="w-4 h-4" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-11 pl-10 pr-4 bg-[#111625] border border-white/10 rounded-xl text-sm text-gray-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="employee">Employee / Team Member</option>
                <option value="manager">Project Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Navigation link to Login */}
        <div className="mt-6 text-center text-xs text-gray-400 font-semibold">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
