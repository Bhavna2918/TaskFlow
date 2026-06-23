import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../context/ToastContext';
import { User, Shield, Key, Eye, EyeOff, Save, CheckCircle, Award, AlertCircle, Upload, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();
  const { toast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(currentUser?.twoFactorEnabled || false);
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast('Please upload only JPG or PNG files', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        toast('Profile picture updated locally! Click save to commit changes.', 'success');
      }
    };
    reader.onerror = () => {
      toast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const updates: any = { name, email, avatar, twoFactorEnabled: twoFactor };
    if (password) updates.password = password;

    setIsLoading(true);
    setError(null);
    try {
      await updateProfile(updates);
      toast('Profile updated successfully!', 'success');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = currentUser?.name ? currentUser.name.charAt(0) : '?';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <User className="w-5.5 h-5.5 text-indigo-500" />
          Collaborator Profile
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Manage your personal details, credentials, and check productivity statistics.
        </p>
      </div>

      {/* Profile Card Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Analytics Cards */}
        <div className="space-y-6 md:col-span-1">
          <div className="p-6 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-center text-gray-800 dark:text-white flex flex-col items-center shadow-glass relative overflow-hidden">
            
            {/* Avatar frame */}
            <div className="relative group cursor-pointer mt-2" onClick={handleAvatarClick}>
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={currentUser?.name}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-500/25 shadow-lg group-hover:opacity-85 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-3xl uppercase group-hover:opacity-85 transition-opacity">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg" 
              className="hidden" 
            />

            <h2 className="text-sm font-bold text-gray-800 dark:text-white mt-4">{currentUser?.name}</h2>
            <span className="inline-block text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded mt-1">
              {currentUser?.role}
            </span>

            <div className="w-full mt-6 space-y-3.5 border-t border-white/5 pt-5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold">Employee ID</span>
                <span className="font-bold font-mono text-gray-200">{currentUser?.employeeId || 'EMP-1001'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold">Account State</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  Active Sync
                </span>
              </div>
            </div>
          </div>

          {/* Productivity Stats card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1424]/85 border border-gray-200 dark:border-white/5 shadow-glass space-y-4">
            <h3 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4 text-indigo-400" />
              Productivity Scores
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Activity Rating</span>
                  <span className="text-gray-200">{currentUser?.role === 'admin' ? '98%' : `${currentUser?.productivity || 80}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-250 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: currentUser?.role === 'admin' ? '98%' : `${currentUser?.productivity || 80}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Completion Score</span>
                  <span className="text-gray-200">{currentUser?.role === 'admin' ? '96%' : `${currentUser?.completionRate || 0}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-250 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: currentUser?.role === 'admin' ? '96%' : `${currentUser?.completionRate || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Settings Form */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0f1424]/85 border border-gray-200 dark:border-white/5 shadow-glass text-gray-800 dark:text-white">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-gray-200 dark:border-white/5 pb-3 mb-5 uppercase tracking-wide text-gray-300">
            <Key className="w-4 h-4 text-indigo-400" />
            Security & Identity Profiles
          </h2>

          <form onSubmit={handleSave} className="space-y-5 text-xs font-semibold">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-250 dark:border-white/10 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-250 dark:border-white/10 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400">Update Password (leave blank to keep current)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-3 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-250 dark:border-white/10 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Upload Trigger */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400">Profile Photo</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="flex items-center justify-center gap-1.5 px-4 h-10 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-xs transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="flex items-center justify-center gap-1.5 px-4 h-10 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs transition-all"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Security Options */}
            <div className="pt-4 border-t border-gray-150 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold block text-gray-200">Two-Factor Authentication</span>
                  <span className="text-[9px] text-gray-400 font-medium">Add another layer of protection to your profile</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={twoFactor} 
                    onChange={(e) => setTwoFactor(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4.5 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-purple-500/20 font-bold transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
