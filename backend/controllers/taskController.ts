import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';
import User from '../models/User';
import Task from '../models/Task';

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    let baseQuery: any = {};

    // Role-based scoping:
    if (currentUser.role === 'employee') {
      baseQuery.assignedToId = currentUser.id;
    } else if (currentUser.role === 'manager') {
      if (currentUser.team) {
        const teamUsers = await User.find({ team: currentUser.team }).select('_id');
        const teamUserIds = teamUsers.map(u => u._id);
        baseQuery = {
          $or: [
            { assignedToId: currentUser.id },
            { assignedById: currentUser.id },
            { assignedToId: { $in: teamUserIds } }
          ]
        };
      } else {
        baseQuery = {
          $or: [
            { assignedToId: currentUser.id },
            { assignedById: currentUser.id }
          ]
        };
      }
    }

    // Extraction of pagination, search, sorting, and filters from query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedToId = req.query.assignedToId as string;
    const projectId = req.query.projectId as string;
    const category = req.query.category as string;
    const dateFilter = req.query.dateFilter as string; // 'today' | 'week' | 'overdue'
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Combine scoping query with search & filters
    const finalQuery: any = { ...baseQuery };

    if (search) {
      finalQuery.$and = finalQuery.$and || [];
      finalQuery.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { assignedTo: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (status && status !== 'all') {
      finalQuery.status = status;
    }

    if (priority && priority !== 'all') {
      finalQuery.priority = priority;
    }

    if (assignedToId && assignedToId !== 'all') {
      finalQuery.assignedToId = assignedToId;
    }

    if (projectId && projectId !== 'all') {
      finalQuery.projectId = projectId;
    }

    if (category && category !== 'all') {
      finalQuery.category = category;
    }

    // Date timeline filters
    if (dateFilter && dateFilter !== 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateFilter === 'today') {
        finalQuery.deadline = todayStr;
      } else if (dateFilter === 'overdue') {
        finalQuery.status = { $ne: 'Completed' };
        finalQuery.deadline = { $lt: todayStr };
      } else if (dateFilter === 'week') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        finalQuery.deadline = { $gte: todayStr, $lte: nextWeekStr };
      }
    }

    // If page and limit parameters are not provided explicitly and a pagination header is absent,
    // default to returning the unpaginated list to keep existing frontend pages working.
    if (!req.query.page && !req.query.limit && req.query.all !== 'false') {
      const tasks = await Task.find(finalQuery)
        .populate('assignedToId', 'name email role avatar team employeeId')
        .populate('assignedById', 'name email role avatar employeeId')
        .populate('projectId', 'name description')
        .sort({ [sortBy]: sortOrder });
      return res.json(tasks);
    }

    const total = await Task.countDocuments(finalQuery);
    const tasks = await Task.find(finalQuery)
      .populate('assignedToId', 'name email role avatar team employeeId')
      .populate('assignedById', 'name email role avatar employeeId')
      .populate('projectId', 'name description')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      tasks,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await TaskService.getTaskById(req.params.id as string);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const currentUser = (req as any).user;

    // Authorization checks:
    if (currentUser.role === 'employee' && task.assignedToId?.toString() !== currentUser.id) {
      res.status(403);
      return next(new Error('Not authorized to view this task'));
    }

    if (currentUser.role === 'manager') {
      const isCreator = task.assignedById?.toString() === currentUser.id;
      const isAssignee = (task.assignedToId as any)?._id?.toString() === currentUser.id;
      const isSameTeam = currentUser.team && (task.assignedToId as any)?.team === currentUser.team;

      if (!isCreator && !isAssignee && !isSameTeam) {
        res.status(403);
        return next(new Error('Not authorized to view this task'));
      }
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    if (currentUser.role === 'employee') {
      res.status(403);
      return next(new Error('Employees are not authorized to create tasks'));
    }

    const task = await TaskService.createTask(req.body, currentUser.name, currentUser.id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findById(req.params.id as string);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const currentUser = (req as any).user;
    const isAssignee = task.assignedToId.toString() === currentUser.id;

    // Authorization checks:
    if (currentUser.role === 'employee' && !isAssignee) {
      res.status(403);
      return next(new Error('Not authorized to update this task'));
    }

    if (currentUser.role === 'manager') {
      const isCreator = task.assignedById?.toString() === currentUser.id;
      const assignedUser = await User.findById(task.assignedToId);
      const isSameTeam = currentUser.team && assignedUser?.team === currentUser.team;

      if (!isCreator && !isAssignee && !isSameTeam) {
        res.status(403);
        return next(new Error('Not authorized to update this task'));
      }
    }

    const updated = await TaskService.updateTask(req.params.id as string, req.body, {
      name: currentUser.name,
      id: currentUser.id,
      role: currentUser.role,
      team: currentUser.team
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findById(req.params.id as string);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const currentUser = (req as any).user;

    // Managers check: must be creator or same team assignee
    if (currentUser.role === 'manager') {
      const isCreator = task.assignedById?.toString() === currentUser.id;
      const assignedUser = await User.findById(task.assignedToId);
      const isSameTeam = currentUser.team && assignedUser?.team === currentUser.team;

      if (!isCreator && !isSameTeam) {
        res.status(403);
        return next(new Error('Not authorized to delete this task'));
      }
    }

    await TaskService.deleteTask(req.params.id as string, {
      name: currentUser.name,
      id: currentUser.id,
      role: currentUser.role,
      team: currentUser.team
    });

    res.json({ success: true, message: 'Task deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};
