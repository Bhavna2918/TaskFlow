import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Cohesive premium color palette
const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

interface TaskProgressProps {
  isDark?: boolean;
}

// 1. Monthly productivity Area/Line chart
export const TaskProgressChart: React.FC<TaskProgressProps> = ({ isDark = true }) => {
  const data = [
    { name: 'Jan', High: 12, Medium: 18, Low: 25 },
    { name: 'Feb', High: 19, Medium: 15, Low: 28 },
    { name: 'Mar', High: 15, Medium: 22, Low: 30 },
    { name: 'Apr', High: 25, Medium: 20, Low: 35 },
    { name: 'May', High: 22, Medium: 28, Low: 42 },
    { name: 'Jun', High: 30, Medium: 25, Low: 38 },
    { name: 'Jul', High: 28, Medium: 32, Low: 45 },
    { name: 'Aug', High: 35, Medium: 30, Low: 40 },
    { name: 'Sep', High: 42, Medium: 38, Low: 48 },
    { name: 'Oct', High: 38, Medium: 35, Low: 44 },
    { name: 'Nov', High: 45, Medium: 40, Low: 50 },
    { name: 'Dec', High: 52, Medium: 48, Low: 58 }
  ];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
        <Tooltip 
          contentStyle={{ 
            background: isDark ? '#0f172a' : '#ffffff', 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '11px',
            color: isDark ? '#fff' : '#000'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
        <Area type="monotone" dataKey="High" stroke="#6366f1" fillOpacity={1} fill="url(#colorHigh)" strokeWidth={2} />
        <Area type="monotone" dataKey="Medium" stroke="#06b6d4" fillOpacity={1} fill="url(#colorMedium)" strokeWidth={2} />
        <Area type="monotone" dataKey="Low" stroke="#ec4899" fillOpacity={1} fill="url(#colorLow)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface DonutProps {
  isDark?: boolean;
  tasks?: any[];
  users?: any[];
}

// 2. Task status Donut chart
export const TaskCompletionDonut: React.FC<DonutProps> = ({ isDark = true, tasks = [], users = [] }) => {
  // Group tasks by status
  const todo = tasks.filter(t => t.status === 'To Do').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const review = tasks.filter(t => t.status === 'Review').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  const data = [
    { name: 'To Do', value: todo || 2 },
    { name: 'In Progress', value: inProgress || 4 },
    { name: 'Review', value: review || 1 },
    { name: 'Completed', value: completed || 5 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={75}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: isDark ? '#0f172a' : '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '11px',
            color: isDark ? '#fff' : '#000'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface TeamBarProps {
  isDark?: boolean;
  users?: any[];
}

// 3. Team performance Bar chart
export const TeamPerformanceBarChart: React.FC<TeamBarProps> = ({ isDark = true, users = [] }) => {
  const data = users.map(u => ({
    name: u.name.split(' ')[0], // First name for label
    Productivity: u.productivity || 80,
    DoneRate: u.completionRate || 85
  })).slice(0, 6); // Top 6 members

  // Fallback data if empty
  const chartData = data.length > 0 ? data : [
    { name: 'Liam', Productivity: 85, DoneRate: 90 },
    { name: 'Sophia', Productivity: 90, DoneRate: 95 },
    { name: 'Mason', Productivity: 78, DoneRate: 80 }
  ];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#0f172a' : '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '11px',
            color: isDark ? '#fff' : '#000'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
        <Bar dataKey="Productivity" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="DoneRate" fill="#06b6d4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface PriorityProps {
  isDark?: boolean;
  tasks?: any[];
}

// 4. Priority breakdown Bar Chart
export const PriorityBreakdownChart: React.FC<PriorityProps> = ({ isDark = true, tasks = [] }) => {
  const counts = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
  tasks.forEach(t => {
    if (counts[t.priority as keyof typeof counts] !== undefined) counts[t.priority as keyof typeof counts]++;
  });

  const data = [
    { name: 'Low', count: counts.Low || 2 },
    { name: 'Medium', count: counts.Medium || 4 },
    { name: 'High', count: counts.High || 3 },
    { name: 'Urgent', count: counts.Urgent || 1 }
  ];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#0f172a' : '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '11px',
            color: isDark ? '#fff' : '#000'
          }}
        />
        <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface ProgressRingProps {
  percentage?: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

// 5. SVG-based Circular Progress Ring
export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage = 0,
  color = '#6366f1',
  size = 80,
  strokeWidth = 8,
  label = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            className="text-gray-200 dark:text-white/5"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xs font-bold text-gray-800 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] mt-2 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
