import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import User from '../models/User';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    let taskQuery: any = {};
    let userQuery: any = {};

    if (currentUser.role === 'employee') {
      taskQuery.assignedToId = currentUser.id;
    } else if (currentUser.role === 'manager') {
      if (currentUser.team) {
        const teamUsers = await User.find({ team: currentUser.team }).select('_id');
        const teamUserIds = teamUsers.map(u => u._id);
        taskQuery = {
          $or: [
            { assignedToId: currentUser.id },
            { assignedById: currentUser.id },
            { assignedToId: { $in: teamUserIds } }
          ]
        };
        userQuery = { team: currentUser.team };
      } else {
        taskQuery = {
          $or: [
            { assignedToId: currentUser.id },
            { assignedById: currentUser.id }
          ]
        };
      }
    }

    const tasks = await Task.find(taskQuery);
    const users = await User.find(userQuery);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const pendingTasks = totalTasks - completedTasks;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline < todayStr).length;

    const avgProductivity = users.length > 0
      ? Math.round(users.reduce((acc, u) => acc + (u.productivity || 80), 0) / users.length)
      : 80;

    const tasksByStatus = {
      'To Do': 0,
      'In Progress': 0,
      'Review': 0,
      'Completed': 0
    };
    tasks.forEach(t => {
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
    });

    const tasksByPriority = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Urgent': 0
    };
    tasks.forEach(t => {
      if (tasksByPriority[t.priority] !== undefined) {
        tasksByPriority[t.priority]++;
      }
    });

    const tasksByCategory: { [key: string]: number } = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      tasksByCategory[cat] = (tasksByCategory[cat] || 0) + 1;
    });

    res.json({
      totalTasks,
      completedTasks,
      completionRate,
      pendingTasks,
      overdueTasks,
      averageProductivity: avgProductivity,
      tasksByStatus,
      tasksByPriority,
      tasksByCategory
    });
  } catch (error) {
    next(error);
  }
};
