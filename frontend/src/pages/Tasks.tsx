import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore, TaskItem, Comment } from '../store/useTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTeamStore } from '../store/useTeamStore';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Search, Filter, Grid, List, Calendar as CalIcon, 
  Trash2, Edit, CheckCircle, Send, MessageSquare, 
  Clock, X, AlertCircle, Paperclip, Tags, User, Folder, Activity, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { EmptyState } from '../components/ui/EmptyState';
import { GridSkeletonLoader } from '../components/ui/SkeletonLoader';

const COLUMNS: TaskItem['status'][] = ['To Do', 'In Progress', 'Review', 'Completed'];

interface TasksProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ searchQuery = "" }) => {
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isManagerOrAdmin = isAdmin || isManager;

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    uploadAttachment
  } = useTaskStore();

  const { team, fetchTeam, loading: teamLoading } = useTeamStore();
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all' | 'today' | 'week' | 'overdue'
  const [sortBy, setSortBy] = useState<'deadline' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal / Drawer state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null); // for editing or viewing details
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false); // for details & comments
  const [isEditing, setIsEditing] = useState(false);

  // Form state (for Create / Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAssignedId, setFormAssignedId] = useState('');
  const [formPriority, setFormPriority] = useState<TaskItem['priority']>('Medium');
  const [formStatus, setFormStatus] = useState<TaskItem['status']>('To Do');
  const [formDeadline, setFormDeadline] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formProjectId, setFormProjectId] = useState('');
  const [formLabels, setFormLabels] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Dragging task state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskItem['status'] | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchTeam();
    fetchProjects();
  }, [currentUser, fetchTasks, fetchTeam, fetchProjects]);

  // Handle Form Submit (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAssignedId || !formDeadline) {
      toast('Please fill in all required fields (title, assignee, deadline)', 'warning');
      return;
    }

    const taskData: Partial<TaskItem> = {
      title: formTitle,
      description: formDesc,
      assignedToId: formAssignedId,
      priority: formPriority,
      status: formStatus,
      deadline: formDeadline,
      category: formCategory || 'General',
      projectId: formProjectId || null,
      labels: formLabels ? formLabels.split(',').map(l => l.trim()).filter(Boolean) : []
    };

    try {
      if (isEditing && selectedTask) {
        // Update task details
        const updated = await updateTask(selectedTask.id, taskData);
        toast('Task updated successfully!', 'success');
        if (selectedTask.id === updated.id) {
          setSelectedTask(updated);
        }
      } else {
        // Create task
        await createTask(taskData);
        toast('Task created successfully!', 'success');
      }
      setTaskModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast(err.message || 'Failed to save task', 'error');
    }
  };

  // Reset form inputs
  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormAssignedId('');
    setFormPriority('Medium');
    setFormStatus('To Do');
    setFormDeadline('');
    setFormCategory('General');
    setFormProjectId('');
    setFormLabels('');
    setSelectedTask(null);
    setIsEditing(false);
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      toast('Task deleted successfully!', 'success');
      if (selectedTask?.id === id) {
        setTaskDrawerOpen(false);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: TaskItem['status']) => {
    e.preventDefault();
    setDragOverColumn(columnStatus);
  };

  const handleDrop = async (e: React.DragEvent, columnStatus: TaskItem['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    setDraggingTaskId(null);

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === columnStatus) return;

    // Confetti on Complete
    if (columnStatus === 'Completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#06b6d4', '#ec4899']
      });
    }

    try {
      const updated = await updateTask(taskId, { status: columnStatus });
      toast(`Task moved to ${columnStatus}`, 'success');
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update task status', 'error');
    }
  };

  // Add Comment (with Mentions search)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const commentObj: Comment = {
      user: currentUser?.name || 'Someone',
      text: newComment,
      timestamp: new Date().toISOString()
    };

    try {
      const updated = await addComment(selectedTask.id, commentObj);
      setSelectedTask(updated);
      setNewComment('');
      setShowMentionSuggestions(false);
      toast('Comment posted!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to post comment', 'error');
    }
  };

  // File Upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    setIsUploading(true);
    try {
      const updated = await uploadAttachment(selectedTask.id, file);
      setSelectedTask(updated);
      toast('Attachment uploaded successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Setup Form for Editing
  const openEditModal = (task: TaskItem) => {
    setSelectedTask(task);
    setIsEditing(true);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormAssignedId(task.assignedToId?.id || task.assignedToId || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDeadline(task.deadline);
    setFormCategory(task.category || 'General');
    setFormProjectId(task.projectId?.id || task.projectId || '');
    setFormLabels(task.labels ? task.labels.join(', ') : '');
    setTaskModalOpen(true);
  };

  // Open Details Drawer
  const openDetailsDrawer = (task: TaskItem) => {
    setSelectedTask(task);
    setTaskDrawerOpen(true);
  };

  // Comment Box keyboard listeners for @mentions
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Check if user just typed @ or is typing after @
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setShowMentionSuggestions(true);
      setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (userName: string) => {
    const words = newComment.split(' ');
    words.pop(); // Remove the typed @part
    words.push(`@${userName} `);
    setNewComment(words.join(' '));
    setShowMentionSuggestions(false);
    commentInputRef.current?.focus();
  };

  // Get Styling Class helpers
  const getPriorityStyles = (p: TaskItem['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Medium':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusStyles = (s: TaskItem['status']) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Review':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'In Progress':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Date check utilities
  const isOverdue = (deadlineStr: string, status: TaskItem['status']) => {
    if (status === 'Completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return deadlineStr < today;
  };

  // Filtering list
  const filteredTasks = tasks.filter(task => {
    // Search query match
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      task.title.toLowerCase().includes(query) ||
      (task.description || "").toLowerCase().includes(query) ||
      (task.category || "").toLowerCase().includes(query) ||
      (task.assignedTo || "").toLowerCase().includes(query);

    // Filter selectors match
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    const assignedId = task.assignedToId?.id || task.assignedToId;
    const matchesUser = userFilter === 'all' || assignedId === userFilter;
    
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    
    const projId = task.projectId?.id || task.projectId;
    const matchesProject = projectFilter === 'all' || projId === projectFilter;

    // Date filters
    let matchesDate = true;
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      matchesDate = task.deadline === todayStr;
    } else if (dateFilter === 'week') {
      const deadline = new Date(task.deadline);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      matchesDate = deadline >= new Date() && deadline <= nextWeek;
    } else if (dateFilter === 'overdue') {
      matchesDate = isOverdue(task.deadline, task.status);
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesUser && matchesCategory && matchesProject && matchesDate;
  }).sort((a, b) => {
    const fieldA = sortBy === 'title' ? a.title.toLowerCase() : a.deadline;
    const fieldB = sortBy === 'title' ? b.title.toLowerCase() : b.deadline;

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const categoriesList = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  // Filter team members based on mention prefix
  const filteredMentionUsers = team.filter(u => {
    if (!currentUser) return false;
    if (u.id === currentUser.id) return false;
    if (!mentionQuery) return true;
    return u.name.toLowerCase().includes(mentionQuery);
  });

  // Track task visual changes inside drawer by fetching latest when task array changes
  const activeDrawerTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) || selectedTask : null;

  return (
    <div className="p-6 space-y-6">
      
      {/* Workspace Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Kanban Board Workspace
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredTasks.length} tasks matching current selections
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Task creation (Manager & Admin only) */}
          {isManagerOrAdmin && (
            <button
              onClick={() => { resetForm(); setTaskModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-neon-glow"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-white flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 pr-2 border-r border-white/10">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Priority</p>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        {/* User Assignment Filter */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Assignee</p>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none max-w-[140px]"
          >
            <option value="all">Everyone</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Project Filter */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Project</p>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none max-w-[150px]"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Date Filter */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Timeline</p>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="overdue">Overdue Tasks</option>
          </select>
        </div>

        {/* Sort Fields */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Sort By</p>
          <div className="flex gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'deadline' | 'title')}
              className="h-8.5 px-2 bg-[#11192e] border border-white/10 rounded-lg text-xs focus:outline-none"
            >
              <option value="deadline">Deadline</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="h-8.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setStatusFilter('all');
            setPriorityFilter('all');
            setUserFilter('all');
            setCategoryFilter('all');
            setProjectFilter('all');
            setDateFilter('all');
            setSortBy('deadline');
            setSortOrder('asc');
          }}
          className="self-end h-8.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {tasksLoading ? (
        <GridSkeletonLoader />
      ) : tasksError ? (
        <div className="text-center text-red-500 py-12">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{tasksError}</p>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Tasks Available"
          message="Your workspace currently has no active board tasks. Create a new task to get started."
          actionText={isManagerOrAdmin ? "Add a Task" : undefined}
          onAction={isManagerOrAdmin ? () => { resetForm(); setTaskModalOpen(true); } : undefined}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Columns Container */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column);
            const isDraggingOver = dragOverColumn === column;

            return (
              <div
                key={column}
                onDragOver={(e) => handleDragOver(e, column)}
                onDrop={(e) => handleDrop(e, column)}
                className={`rounded-2xl p-4 transition-all min-h-[500px] flex flex-col ${
                  isDraggingOver 
                    ? 'border border-indigo-500 bg-indigo-500/5 shadow-neon-glow' 
                    : 'border border-white/5 bg-white/5'
                }`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      column === 'Completed' ? 'bg-emerald-500' :
                      column === 'Review' ? 'bg-amber-500' :
                      column === 'In Progress' ? 'bg-cyan-500' : 'bg-gray-500'
                    }`}></span>
                    {column}
                  </h3>
                  <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3.5 flex-1">
                  {columnTasks.map((task) => {
                    const assignee = team.find(u => u.id === (task.assignedToId?.id || task.assignedToId));
                    const overdue = isOverdue(task.deadline, task.status);

                    return (
                      <motion.div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md text-white hover:border-white/20 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                        style={{
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {/* Task project label */}
                        {task.projectId && (
                          <div className="flex items-center gap-1 text-[9px] text-indigo-400 font-semibold mb-2">
                            <Folder className="w-2.5 h-2.5" />
                            <span>{typeof task.projectId === 'object' ? task.projectId.name : projects.find(p => p.id === task.projectId)?.name || 'Project'}</span>
                          </div>
                        )}

                        <h4 
                          onClick={() => openDetailsDrawer(task)}
                          className="text-xs font-bold hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
                        >
                          {task.title}
                        </h4>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {/* Priority flag */}
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${getPriorityStyles(task.priority)}`}>
                            {task.priority}
                          </span>
                          
                          {/* Labels */}
                          {task.labels?.slice(0, 2).map((lbl, idx) => (
                            <span key={idx} className="text-[8.5px] bg-white/5 border border-white/15 text-gray-300 px-1.5 py-0.5 rounded font-medium">
                              {lbl}
                            </span>
                          ))}
                        </div>

                        {/* Card footer */}
                        <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-white/5">
                          <div className={`flex items-center gap-1 text-[9px] font-semibold ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{task.deadline}</span>
                            {overdue && <span className="text-[8px] uppercase font-bold text-red-500 pr-1 ml-0.5 animate-pulse border border-red-500/20 bg-red-500/5 px-1 rounded">Overdue</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Comments indicator */}
                            {task.comments?.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                                <MessageSquare className="w-3 h-3" />
                                {task.comments.length}
                              </span>
                            )}
                            
                            {/* File Attachments indicator */}
                            {task.attachments?.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                                <Paperclip className="w-3 h-3" />
                                {task.attachments.length}
                              </span>
                            )}

                            {/* User Avatar */}
                            {assignee?.avatar ? (
                              <img
                                className="h-5.5 w-5.5 rounded-full object-cover border border-white/10"
                                src={assignee.avatar}
                                alt={task.assignedTo}
                                title={`Assigned to ${task.assignedTo}`}
                              />
                            ) : (
                              <div 
                                className="h-5.5 w-5.5 rounded-full flex items-center justify-center bg-indigo-600 border border-white/10 text-[9px] font-bold"
                                title={`Assigned to ${task.assignedTo}`}
                              >
                                {task.assignedTo ? task.assignedTo.substring(0, 2).toUpperCase() : '??'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover Quick actions (Admin / Creator Manager) */}
                        {isManagerOrAdmin && (
                          <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 focus-within:opacity-100 flex gap-1 transition-opacity">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 bg-[#11192e]/80 border border-white/10 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 rounded-xl border border-dashed border-white/5 text-gray-500 text-[10px]">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-x-auto text-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="p-4">Task Title</th>
                <th className="p-4">Project</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadline</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredTasks.map((task) => {
                const assignee = team.find(u => u.id === (task.assignedToId?.id || task.assignedToId));
                const projectName = typeof task.projectId === 'object' ? task.projectId?.name : projects.find(p => p.id === task.projectId)?.name;

                return (
                  <tr key={task.id} className="hover:bg-white/5 transition-all">
                    <td className="p-4">
                      <button 
                        onClick={() => openDetailsDrawer(task)}
                        className="font-bold text-white hover:text-indigo-400 text-left transition-colors"
                      >
                        {task.title}
                      </button>
                      {task.category && (
                        <span className="ml-2.5 text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-medium">
                          {task.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-indigo-400">
                      {projectName || 'Global'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {assignee?.avatar ? (
                          <img
                            className="h-6 w-6 rounded-full object-cover border border-white/10"
                            src={assignee.avatar}
                            alt={task.assignedTo}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full flex items-center justify-center bg-indigo-600 border border-white/10 text-[9px] font-bold">
                            {task.assignedTo ? task.assignedTo.substring(0, 2).toUpperCase() : '??'}
                          </div>
                        )}
                        <span>{task.assignedTo}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${getStatusStyles(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {task.deadline}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetailsDrawer(task)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        {isManagerOrAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Creation / Editing Modal */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-2xl bg-[#0e172e] border border-white/10 text-white p-6 shadow-glass z-10"
            >
              <button
                onClick={() => setTaskModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                {isEditing ? 'Edit Task Settings' : 'Create New Board Task'}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Task name or user story..."
                    className="w-full h-10 px-3.5 bg-[#0b1329]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Description</label>
                  <textarea
                    rows={2.5}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Explain the scope and technical deliverables..."
                    className="w-full p-3 bg-[#0b1329]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Assignee */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Assign To *</label>
                    <select
                      required
                      value={formAssignedId}
                      onChange={(e) => setFormAssignedId(e.target.value)}
                      className="w-full h-10 px-3 bg-[#11192e] border border-white/10 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="">Select Assignee</option>
                      {team.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>

                  {/* Project */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Associate Project</label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full h-10 px-3 bg-[#11192e] border border-white/10 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="">No Project Mapping</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskItem['priority'])}
                      className="w-full h-10 px-3 bg-[#11192e] border border-white/10 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TaskItem['status'])}
                      className="w-full h-10 px-3 bg-[#11192e] border border-white/10 rounded-xl text-xs focus:outline-none"
                    >
                      {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Deadline *</label>
                    <input
                      type="date"
                      required
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="w-full h-10 px-3 bg-[#11192e] border border-white/10 rounded-xl text-xs focus:outline-none text-white appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Category Tag</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Frontend, DevOps, Bugfix"
                      className="w-full h-10 px-3.5 bg-[#0b1329]/50 border border-white/10 rounded-xl text-xs focus:outline-none text-white"
                    />
                  </div>

                  {/* Labels */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Tags className="w-3.5 h-3.5" />
                      Labels (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formLabels}
                      onChange={(e) => setFormLabels(e.target.value)}
                      placeholder="e.g. Sprint-1, Blocked"
                      className="w-full h-10 px-3.5 bg-[#0b1329]/50 border border-white/10 rounded-xl text-xs focus:outline-none text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="px-4.5 py-2 border border-white/10 rounded-xl text-xs hover:bg-white/5 transition-all text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-neon-glow"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Drawer */}
      <AnimatePresence>
        {taskDrawerOpen && activeDrawerTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            ></motion.div>

            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-full max-w-lg h-full bg-[#0b1329] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    {activeDrawerTask.category || 'General'} Task Details
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 pr-4 line-clamp-1">{activeDrawerTask.title}</h3>
                </div>
                <button
                  onClick={() => setTaskDrawerOpen(false)}
                  className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details area */}
              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                
                {/* Meta details list */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Assignee</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const assignee = team.find(u => u.id === (activeDrawerTask.assignedToId?.id || activeDrawerTask.assignedToId));
                        return assignee?.avatar ? (
                          <img
                            className="h-6 w-6 rounded-full object-cover border border-white/10"
                            src={assignee.avatar}
                            alt={activeDrawerTask.assignedTo}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full flex items-center justify-center bg-indigo-600 border border-white/10 text-[9px] font-bold">
                            {activeDrawerTask.assignedTo ? activeDrawerTask.assignedTo.substring(0, 2).toUpperCase() : '??'}
                          </div>
                        );
                      })()}
                      <span className="text-xs font-bold">{activeDrawerTask.assignedTo}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Due Date</span>
                    <span className="text-xs font-bold block flex items-center gap-1">
                      <CalIcon className="w-3.5 h-3.5 text-indigo-400" />
                      {activeDrawerTask.deadline}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Priority</span>
                    <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${getPriorityStyles(activeDrawerTask.priority)}`}>
                      {activeDrawerTask.priority}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Status</span>
                    <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${getStatusStyles(activeDrawerTask.status)}`}>
                      {activeDrawerTask.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Scope / Description</span>
                  <p className="text-xs text-gray-300 bg-white/5 border border-white/5 rounded-2xl p-4 leading-relaxed whitespace-pre-line text-slate-300">
                    {activeDrawerTask.description || 'No detailed scope provided.'}
                  </p>
                </div>

                {/* File Attachments */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                      File Sharing ({activeDrawerTask.attachments?.length || 0})
                    </span>
                    
                    {/* Add attachment trigger */}
                    <button
                      onClick={triggerFileUpload}
                      className="text-[10px] text-indigo-400 hover:text-white font-bold transition-colors"
                    >
                      + Attach File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    {activeDrawerTask.attachments?.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex items-center gap-2 max-w-[80%]">
                          <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs font-semibold truncate text-white">{file.name}</span>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-400 hover:underline font-bold"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                    {(!activeDrawerTask.attachments || activeDrawerTask.attachments.length === 0) && (
                      <div className="text-center py-4 rounded-xl border border-dashed border-white/5 text-gray-500 text-xs">
                        No attachments uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Center */}
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-3 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Discussion Comments ({activeDrawerTask.comments?.length || 0})
                  </span>

                  {/* Comment input form */}
                  <form onSubmit={handleAddComment} className="relative mb-4">
                    <input
                      type="text"
                      ref={commentInputRef}
                      value={newComment}
                      onChange={handleCommentChange}
                      placeholder="Discuss progress (use @name to mention team)..."
                      className="w-full h-10 pl-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    {/* Mentions autocomplete popup */}
                    {showMentionSuggestions && (
                      <div className="absolute bottom-11 left-0 z-20 w-44 rounded-xl border border-white/10 bg-[#11192e] p-1.5 shadow-glass text-white max-h-32 overflow-y-auto">
                        <p className="text-[9px] font-bold text-gray-400 px-2 py-1 uppercase">Mention User</p>
                        {filteredMentionUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectMention(u.name.split(' ')[0])}
                            className="w-full flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg text-left text-xs"
                          >
                            {u.avatar ? (
                              <img className="w-5 h-5 rounded-full object-cover" src={u.avatar} alt="" />
                            ) : (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-600 border border-white/10 text-[9px] font-bold">
                                {u.name ? u.name.substring(0, 2).toUpperCase() : '??'}
                              </div>
                            )}
                            <span className="truncate">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </form>

                  {/* Comments lists */}
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {activeDrawerTask.comments?.slice().reverse().map((comm, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-indigo-400">{comm.user}</span>
                          <span className="text-[8px] text-gray-500">{new Date(comm.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed text-slate-300">{comm.text}</p>
                      </div>
                    ))}
                    {(!activeDrawerTask.comments || activeDrawerTask.comments.length === 0) && (
                      <div className="text-center py-4 rounded-xl border border-dashed border-white/5 text-gray-500 text-xs">
                        Start the discussion! Type your comment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Activity Logs */}
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-2.5 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Task History Log
                  </span>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2.5">
                    {activeDrawerTask.history?.slice().reverse().map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[10px] text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0"></span>
                        <div>
                          <p className="text-slate-300">
                            <span className="font-bold text-white pr-1">{log.user}</span>
                            {log.action}
                          </p>
                          <span className="text-[8px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
