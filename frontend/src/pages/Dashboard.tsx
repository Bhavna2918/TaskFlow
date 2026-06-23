import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTeamStore } from '../store/useTeamStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { 
  CheckCircle, AlertCircle, TrendingUp, Clock, 
  Activity, UserCheck, Users, Folder, CheckSquare, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  TaskProgressChart, 
  TaskCompletionDonut, 
  TeamPerformanceBarChart,
  PriorityBreakdownChart, 
  ProgressRing 
} from '../components/Charts';

interface DashboardProps {
  theme?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ theme = 'dark' }) => {
  const { currentUser } = useAuthStore();
  const { tasks, fetchTasks, loading: tasksLoading } = useTaskStore();
  const { projects, fetchProjects, loading: projLoading } = useProjectStore();
  const { team, fetchTeam, loading: teamLoading } = useTeamStore();
  const { notifications, fetchNotifications } = useNotificationStore();

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTeam();
    fetchNotifications();
  }, [fetchTasks, fetchProjects, fetchTeam, fetchNotifications]);

  const isLoading = tasksLoading || projLoading || teamLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-250 dark:bg-white/5 w-48 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-gray-250 dark:bg-white/5 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-250 dark:bg-white/5 lg:col-span-2 rounded-2xl"></div>
          <div className="h-80 bg-gray-250 dark:bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // --- STATS COMPUTATION ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'Review').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;
  
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksCount = tasks.filter(t => t.status !== 'Completed' && t.deadline < todayStr).length;

  const dueSoonTasks = tasks.filter(t => {
    if (t.status === 'Completed') return false;
    const diffTime = new Date(t.deadline).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).slice(0, 5);

  // Audit activity timeline
  const activityFeed = tasks
    .flatMap(t => (t.history || []).map(h => ({ ...h, taskTitle: t.title, taskId: t.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Filter team members (same team as Manager or all for Admin)
  const teamMembers = currentUser?.role === 'admin' 
    ? team 
    : team.filter(u => u.team === currentUser?.team);

  return (
    <div className="p-6 space-y-6">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Workspace Hub
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full capitalize font-bold">
              {currentUser?.role} View
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-bold text-gray-800 dark:text-white">{currentUser?.name}</span>. Here is your workspace summary.
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-bold bg-[#0f1424]/85 border border-white/5 px-4 py-2.5 rounded-xl">
          Logged as: <span className="text-indigo-400">{currentUser?.email}</span>
        </div>
      </div>

      {/* 4 CORE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Users / Team size */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white shadow-glass hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Users</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{team.length}</h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 font-bold">Registered collaborators</p>
        </div>

        {/* Card 2: Active Projects */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white shadow-glass hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Projects</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{projects.length}</h3>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Folder className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 font-bold">Active branches</p>
        </div>

        {/* Card 3: Tasks Completed */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white shadow-glass hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tasks Completed</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{completedTasks}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-4 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {Math.round(completionRate)}% Done Rate
          </p>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white shadow-glass hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overdue Tasks</p>
              <h3 className="text-2xl font-bold mt-2 text-red-400">{overdueTasksCount}</h3>
            </div>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-red-500 mt-4 font-bold">Require scope review</p>
        </div>
      </div>

      {/* RECHARTS PLOTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Workspace Productivity</h3>
            <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 font-bold">Aggregated</span>
          </div>
          <div className="flex-1 min-h-0">
            <TaskProgressChart isDark={isDark} />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Board Status Splits</h3>
          <div className="grid grid-cols-2 gap-4 flex-1 items-center justify-center">
            <ProgressRing percentage={todoTasks > 0 ? (todoTasks / totalTasks) * 100 : 0} color="#94a3b8" label="To Do" />
            <ProgressRing percentage={inProgressTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0} color="#06b6d4" label="In Progress" />
            <ProgressRing percentage={reviewTasks > 0 ? (reviewTasks / totalTasks) * 100 : 0} color="#f59e0b" label="Review" />
            <ProgressRing percentage={completionRate} color="#10b981" label="Completed" />
          </div>
        </div>
      </div>

      {/* ADDITIONAL PERFORMANCE VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Bar Chart */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Team Performance comparison</h3>
          <div className="flex-1 min-h-0">
            <TeamPerformanceBarChart isDark={isDark} users={teamMembers} />
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Task Priority splits</h3>
          <div className="flex-1 min-h-0">
            <PriorityBreakdownChart isDark={isDark} tasks={tasks} />
          </div>
        </div>

        {/* Task completion distribution donut */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Task Contributions</h3>
          <div className="flex-1 min-h-0">
            <TaskCompletionDonut isDark={isDark} tasks={tasks} users={team} />
          </div>
        </div>
      </div>

      {/* METADATA LISTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Activity Timeline
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-white/5">
            {activityFeed.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No activity logged in this workspace.</div>
            ) : (
              activityFeed.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs pt-3 first:pt-0 border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300">
                      <span className="font-bold text-white pr-1">{act.user}</span>
                      {act.action} on{' '}
                      <span className="text-indigo-400 font-bold truncate inline-block max-w-[150px] align-bottom">
                        {act.taskTitle}
                      </span>
                    </p>
                    <span className="text-[9px] text-gray-550 mt-1 block">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            Recent Alerts Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No recent notifications.</div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex gap-3 text-xs pt-3 first:pt-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{notif.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 break-words">{notif.message}</p>
                    <span className="text-[9px] text-gray-550 mt-1 block">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0f1424]/85 text-white flex flex-col h-80 shadow-glass">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Upcoming Deadlines (3 Days)
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-white/5">
            {dueSoonTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No deadlines in the next 3 days.</div>
            ) : (
              dueSoonTasks.map((t) => (
                <div key={t.id} className="flex justify-between items-center pt-3 first:pt-0">
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[160px]">{t.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Deadline: {t.deadline}</p>
                  </div>
                  <span className={`text-[8.5px] px-2 py-0.5 rounded font-bold uppercase border ${
                    t.priority === 'Urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-550/20'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
