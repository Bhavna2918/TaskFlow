import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Command } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuthStore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter your email', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
      toast('Password reset email sent successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Request failed. Please try again.', 'error');
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
          <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-xs text-gray-400 mt-1">We will send you a recovery link</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-xs font-bold">
              Verification email dispatched. Check your inbox and terminal console for reset link details.
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Recovery Link'
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
