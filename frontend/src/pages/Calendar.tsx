import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, AlertCircle, X, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  deadline: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: string;
  progress: number;
  assignedTo: string;
  assignedToId: string;
  description: string;
}

const Calendar: React.FC = () => {
  const { currentUser } = useAuthStore();
  
  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  // Anchor to June 2026 for demo matching dummyData deadlines
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 20));
  const [selectedTask, setSelectedTask] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/calendar/events');
      const mapped = res.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        deadline: event.start,
        ...event.extendedProps
      }));
      setTasks(mapped);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, [currentUser]);

  // Calendar logic helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Get total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Prev Month / Next Month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get tasks that are due on a specific date (YYYY-MM-DD)
  const getTasksForDay = (day: number) => {
    const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.deadline === formattedDay);
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500 shadow-neon-pink text-white';
      case 'High': return 'bg-amber-500 shadow-neon-glow text-white';
      case 'Medium': return 'bg-cyan-500 shadow-neon-cyan text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const isOverdue = (task: CalendarEvent) => {
    if (task.status === 'Completed') return false;
    const taskDate = new Date(task.deadline);
    const today = new Date(2026, 5, 20); // Anchored today date matching metadata
    return taskDate < today;
  };

  // Generate grid cells
  const cells: { day: number | null; key: string }[] = [];
  // Empty blocks for padding
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  // Days of month
  for (let i = 1; i <= totalDays; i++) {
    cells.push({ day: i, key: `day-${i}` });
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold flex flex-col items-center justify-center gap-2 min-h-[50vh]">
        <AlertCircle className="w-10 h-10 text-red-500 animate-bounce" />
        <h3 className="text-lg">Failed to load Calendar schedule</h3>
        <p className="text-xs text-gray-400 max-w-md">{error}</p>
        <button
          onClick={fetchCalendarTasks}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all font-bold shadow-neon-glow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-16 bg-gray-300 dark:bg-white/5 rounded-2xl"></div>
        <div className="h-[400px] bg-gray-300 dark:bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Calendar Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-[#0e172e] border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CalIcon className="w-5 h-5 text-indigo-400" />
            Project Calendar
          </h1>
          <p className="text-xs text-gray-400 font-medium">Click on highlighted tasks to view progress logs</p>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-800 dark:text-white w-28 text-center uppercase tracking-wide">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid calendar layout */}
      <div className="bg-white dark:bg-[#0e172e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-center text-xs font-bold text-gray-400 py-3">
          {weekdays.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-150 dark:divide-white/5 bg-gray-50/20 dark:bg-[#0b1329]/15">
          {cells.map((cell) => {
            const dayTasks = cell.day ? getTasksForDay(cell.day) : [];
            const isToday = cell.day === 20 && month === 5 && year === 2026; // Highlight today 2026-06-20

            return (
              <div
                key={cell.key}
                className="calendar-grid-cell p-2 min-h-24 flex flex-col items-stretch text-left group bg-white dark:bg-[#0e172e] transition-colors hover:bg-gray-50/30 dark:hover:bg-white/[0.01]"
              >
                {cell.day && (
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isToday 
                        ? 'bg-indigo-600 text-white shadow-neon-glow' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {cell.day}
                    </span>
                    {dayTasks.some(isOverdue) && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Task overdue" />
                    )}
                  </div>
                )}
                
                {/* Due tasks list */}
                <div className="flex-1 space-y-1.5 overflow-y-auto mt-1">
                  {dayTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-1.5 rounded-lg text-[9px] font-semibold truncate leading-tight select-none border border-transparent hover:scale-[1.02] active:scale-[0.98] transition-all block ${getPriorityColor(task.priority)} ${
                        task.status === 'Completed' ? 'opacity-50 line-through' : ''
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* QUICK PREVIEW DIALOG MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0e172e] border border-gray-200 dark:border-white/10 shadow-2xl p-5 relative z-10 text-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/10">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">{selectedTask.category}</span>
                  <h3 className="text-xs font-bold mt-1 text-indigo-400">{selectedTask.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-xs font-medium">
                <p className="text-gray-500 dark:text-gray-300 leading-snug">{selectedTask.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Assignee</span>
                    <span className="font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {selectedTask.assignedTo}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Status State</span>
                    <span className="font-bold">{selectedTask.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-red-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {selectedTask.deadline}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-semibold">Progress: {selectedTask.progress}%</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
