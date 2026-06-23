import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { 
  TaskProgressChart, TaskCompletionDonut, 
  PriorityBreakdownChart, ProgressRing 
} from '../components/Charts';
import api from '../services/api';

interface ReportsProps {
  theme: string;
}

const Reports: React.FC<ReportsProps> = ({ theme }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const fetchData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users')
      ]);
      setTasks(tRes.data);
      setUsers(uRes.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch reports data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Metrics
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const review = tasks.filter(t => t.status === 'Review').length;
  const todo = tasks.filter(t => t.status === 'To Do').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate average productivity score of team
  const avgProductivity = users.length > 0
    ? Math.round(users.reduce((acc, u) => acc + (u.productivity || 80), 0) / users.length)
    : 88;

  // CSV Export handler
  const handleExportCSV = () => {
    if (tasks.length === 0) return;

    // Header row
    const headers = ['Task ID', 'Title', 'Category', 'Assignee', 'Priority', 'Status', 'Progress (%)', 'Deadline'];
    
    // Task rows
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category || 'General',
      t.assignedTo,
      t.priority,
      t.status,
      t.progress,
      t.deadline
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TaskFlow_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold flex flex-col items-center justify-center gap-2 min-h-[50vh]">
        <AlertCircle className="w-10 h-10 text-red-500 animate-bounce" />
        <h3 className="text-lg">Failed to load Productivity Reports</h3>
        <p className="text-xs text-gray-400 max-w-md">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all font-bold shadow-neon-glow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-white/10 w-48 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-gray-300 dark:bg-white/5 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Reports Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-indigo-400" />
            Productivity Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Analyze execution ratios, priority load charts, and download CSV spreadsheet reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] shadow-neon-glow transition-all"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white">
          <p className="text-xs font-semibold text-gray-400">Total Tasks Monitored</p>
          <h3 className="text-2xl font-bold mt-1.5">{total}</h3>
          <span className="text-[10px] text-gray-400 block mt-2 font-semibold">Active project items in scope</span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white">
          <p className="text-xs font-semibold text-gray-400">Completion Ratio</p>
          <h3 className="text-2xl font-bold mt-1.5 text-emerald-500">{completionRate}%</h3>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-emerald-500" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white">
          <p className="text-xs font-semibold text-gray-400">Collaborator Avg Productivity</p>
          <h3 className="text-2xl font-bold mt-1.5 text-cyan-400">{avgProductivity}%</h3>
          <span className="text-[10px] text-gray-400 block mt-2 font-semibold">Team performance rating</span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white">
          <p className="text-xs font-semibold text-gray-400">Pending Actions</p>
          <h3 className="text-2xl font-bold mt-1.5 text-amber-500">{total - completed}</h3>
          <span className="text-[10px] text-gray-400 block mt-2 font-semibold">Items currently in flow status</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar priority breakdown */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white h-80 flex flex-col">
          <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4">Task Priority Distribution</h3>
          <div className="flex-1 min-h-0">
            <PriorityBreakdownChart isDark={isDark} tasks={tasks} />
          </div>
        </div>

        {/* Donut Contribution chart */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white h-80 flex flex-col">
          <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4">Done Count by Collaborator</h3>
          <div className="flex-1 min-h-0">
            <TaskCompletionDonut isDark={isDark} tasks={tasks} users={users} />
          </div>
        </div>

        {/* Rings */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white h-80 flex flex-col">
          <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4">Overall Completion Ratios</h3>
          <div className="grid grid-cols-2 gap-4 flex-1 items-center justify-center">
            <ProgressRing percentage={todo > 0 ? (todo / total) * 100 : 0} color="#94a3b8" label="To Do" />
            <ProgressRing percentage={inProgress > 0 ? (inProgress / total) * 100 : 0} color="#06b6d4" label="In Progress" />
            <ProgressRing percentage={review > 0 ? (review / total) * 100 : 0} color="#f59e0b" label="Review" />
            <ProgressRing percentage={completionRate} color="#10b981" label="Completed" />
          </div>
        </div>

      </div>

      {/* Progress Timeline Area Chart */}
      <div className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md text-gray-800 dark:text-white h-96 flex flex-col">
        <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4">Monthly Productive Output</h3>
        <div className="flex-1 min-h-0">
          <TaskProgressChart isDark={isDark} />
        </div>
      </div>

    </div>
  );
};

export default Reports;
