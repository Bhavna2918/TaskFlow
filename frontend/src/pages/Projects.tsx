import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTeamStore } from '../store/useTeamStore';
import { useToast } from '../context/ToastContext';
import { Plus, Folder, Users, AlertCircle, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Projects: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    fetchProjects,
    createProject
  } = useProjectStore();

  const {
    team: users,
    loading: teamLoading,
    fetchTeam
  } = useTeamStore();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTeam();
  }, [fetchProjects, fetchTeam]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast('Please enter a project name', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        name: projectName,
        description: projectDesc,
        members: selectedMembers
      });
      toast('Project created successfully!', 'success');
      
      // Reset form
      setProjectName('');
      setProjectDesc('');
      setSelectedMembers([]);
      setModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Failed to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleRetry = () => {
    fetchProjects();
    fetchTeam();
  };

  if (projectsError) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold flex flex-col items-center justify-center gap-2 min-h-[50vh]">
        <AlertCircle className="w-10 h-10 text-red-500 animate-bounce" />
        <h3 className="text-lg">Failed to load Projects</h3>
        <p className="text-xs text-gray-400 max-w-md">{projectsError}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all font-bold shadow-neon-glow"
        >
          Retry
        </button>
      </div>
    );
  }

  const isLoading = projectsLoading || teamLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Workspaces & Projects
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage projects, scope tasks, and configure team members.
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-neon-glow"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-gray-300 dark:bg-white/5 rounded-2xl"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center p-12 rounded-2xl border border-white/5 bg-white/5 text-gray-400">
          <Folder className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Projects Found</h3>
          <p className="text-xs mt-1">Get started by creating a new workspace project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-white">{project.name}</h3>
                    <p className="text-[10px] text-gray-400">Created by {project.creator?.name || 'Manager'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 line-clamp-3 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {/* Members list */}
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {project.members?.slice(0, 4).map((member: any) => {
                    const memberId = typeof member === 'object' ? member.id : member;
                    const teamMember = users.find(u => u.id === memberId);
                    const avatarUrl = teamMember?.avatar || member?.avatar;
                    const memberName = teamMember?.name || member?.name || 'Member';

                    return avatarUrl ? (
                      <img
                        key={memberId}
                        className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-[#0b1329] object-cover"
                        src={avatarUrl}
                        alt={memberName}
                        title={memberName}
                      />
                    ) : (
                      <div
                        key={memberId}
                        className="inline-block h-6.5 w-6.5 rounded-full bg-indigo-600 ring-2 ring-[#0b1329] text-[9px] font-bold flex items-center justify-center"
                        title={memberName}
                      >
                        {memberName.substring(0, 2).toUpperCase()}
                      </div>
                    );
                  })}
                  {project.members?.length > 4 && (
                    <div className="flex items-center justify-center h-6.5 w-6.5 rounded-full bg-white/10 ring-2 ring-[#0b1329] text-[10px] font-bold text-gray-300">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {project.tasks?.length || 0} Tasks
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#0e172e] text-white p-6 shadow-glass border border-white/10 z-10"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-400" />
                Create New Project
              </h2>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Mobile Application V2"
                    className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Provide a brief summary of this workspace's goals..."
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Assign Team Members
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-white/10 rounded-xl p-2 bg-white/5 space-y-1.5">
                    {users.map((u) => {
                      const isSelected = selectedMembers.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleMember(u.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            isSelected ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {u.avatar ? (
                              <img
                                className="h-7 w-7 rounded-full object-cover"
                                src={u.avatar}
                                alt={u.name}
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full flex items-center justify-center bg-indigo-600 border border-white/10 text-[9px] font-bold text-white">
                                {u.name ? u.name.substring(0, 2).toUpperCase() : '??'}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-white leading-none">{u.name}</p>
                              <p className="text-[9px] text-gray-400 mt-1 capitalize">{u.role} {u.team ? `• ${u.team}` : ''}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-4.5 h-4.5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-white/10 rounded-xl text-xs hover:bg-white/5 transition-all text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-neon-glow"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Workspace'
                    )}
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

export default Projects;
