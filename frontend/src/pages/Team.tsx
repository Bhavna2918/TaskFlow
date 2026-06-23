import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useTeamStore } from '../store/useTeamStore';
import { useTaskStore } from '../store/useTaskStore';
import { useToast } from '../context/ToastContext';
import { 
  Users, Plus, Trash2, Award, Zap, CheckSquare, 
  TrendingUp, Star, Mail, X, ShieldCheck, AlertCircle, Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../components/ui/EmptyState';
import { GridSkeletonLoader } from '../components/ui/SkeletonLoader';

const Team: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { team, loading: teamLoading, error: teamError, fetchTeam, addMember, removeMember } = useTeamStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { toast } = useToast();

  const isAdmin = currentUser?.role === 'admin';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('productivity'); // 'productivity' | 'name'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchTasks();
  }, [fetchTeam, fetchTasks]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) return;

    setModalLoading(true);
    try {
      await addMember({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole
      });
      toast(`Successfully added team member: ${formName}`, 'success');
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast(err.message || 'Failed to add member', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    try {
      await removeMember(id);
      toast(`Removed collaborator ${name} successfully`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to remove member', 'error');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('employee');
  };

  const getUserTaskStats = (userId: string) => {
    const userTasks = tasks.filter(t => {
      const assignedId = t.assignedToId?.id || t.assignedToId;
      return assignedId === userId;
    });
    const pending = userTasks.filter(t => t.status !== 'Completed').length;
    return {
      total: userTasks.length,
      pending
    };
  };

  // Filter & Sort collaborators
  const filteredTeam = team.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (sortBy === 'productivity') {
      return (b.productivity || 0) - (a.productivity || 0);
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  if (teamError) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold flex flex-col items-center justify-center gap-2 min-h-[50vh]">
        <AlertCircle className="w-10 h-10 text-red-500 animate-bounce" />
        <h3 className="text-lg">Failed to load Team Directory</h3>
        <p className="text-xs text-gray-400 max-w-md">{teamError}</p>
        <button
          onClick={() => fetchTeam()}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs hover:opacity-90 transition-all font-bold shadow-neon-glow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-indigo-500" />
            Team Directory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Productivity stats, ratings and task loads across workspace collaborators
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] shadow-lg shadow-purple-500/20 transition-all shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Member
          </button>
        )}
      </div>

      {/* Filters & Search Controls */}
      <div className="p-4 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-wrap gap-4 items-center shadow-glass">
        {/* Search */}
        <div className="relative max-w-xs w-full flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search collaborators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-2 bg-[#111625] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="employee">Employees</option>
            <option value="manager">Managers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        {/* Sort order */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-2 bg-[#111625] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="productivity">Highest Productivity</option>
            <option value="name">Alphabetical Name</option>
          </select>
        </div>
      </div>

      {teamLoading ? (
        <GridSkeletonLoader />
      ) : filteredTeam.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No team members found"
          message={searchQuery || roleFilter !== 'all' ? "No collaborators match your search filters." : "Start building your team to delegate tasks."}
          actionText={isAdmin ? "Create your first employee" : undefined}
          onAction={isAdmin ? () => setModalOpen(true) : undefined}
        />
      ) : (
        /* Team Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((member) => {
            const stats = getUserTaskStats(member.id);
            const isSelf = member.id === currentUser?.id;
            const initials = member.name.charAt(0);

            return (
              <motion.div
                key={member.id}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white p-5 hover:border-indigo-500/20 transition-all relative overflow-hidden shadow-glass"
              >
                {/* Actions panel (Delete member for Admin, self exclusion) */}
                {isAdmin && !isSelf && (
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Avatar Info */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xl uppercase shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white truncate leading-tight">{member.name}</h3>
                      {isSelf && (
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {member.role === 'admin' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="text-[10px] text-gray-400 capitalize font-bold">{member.role}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-medium select-all">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2 py-4 text-center border-b border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block tracking-wider">Productivity</span>
                    <div className="flex items-center justify-center gap-0.5 text-emerald-400">
                      <Zap className="w-3 h-3 shrink-0" />
                      <span className="text-xs font-bold">{member.productivity || 80}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block tracking-wider">Completion</span>
                    <div className="flex items-center justify-center gap-0.5 text-indigo-400">
                      <TrendingUp className="w-3 h-3 shrink-0" />
                      <span className="text-xs font-bold">{member.completionRate || 0}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block tracking-wider">Rating</span>
                    <div className="flex items-center justify-center gap-0.5 text-amber-500">
                      <Star className="w-3.5 h-3.5 shrink-0 fill-current" />
                      <span className="text-xs font-bold">{member.performanceScore || 7.0}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Tasks */}
                <div className="flex justify-between items-center pt-3.5 text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    {stats.total} Assigned Tasks
                  </span>
                  <span className={`px-2 py-0.5 rounded ${stats.pending > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-550/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}`}>
                    {stats.pending} Pending
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* INVITE MEMBER MODAL DIALOG (Admin Only) */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-[#0f1424] border border-white/10 shadow-2xl p-6 relative z-10 text-white"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="font-bold text-sm">Add Team Collaborator</h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 text-xs font-semibold">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Sterling"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="liam@taskflow.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Role Privilege</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#111625] border border-white/10 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="employee">Employee / Team Member</option>
                    <option value="manager">Project Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold disabled:opacity-50"
                  >
                    {modalLoading ? 'Adding...' : 'Invite Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Team;
