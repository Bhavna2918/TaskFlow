import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';

export const getCalendarEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    let taskQuery: any = {};

    if (currentUser.role === 'employee') {
      taskQuery.assignedToId = currentUser.id;
    }

    const tasks = await Task.find(taskQuery);

    const events = tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.deadline, // YYYY-MM-DD
      allDay: true,
      extendedProps: {
        status: task.status,
        priority: task.priority,
        category: task.category,
        progress: task.progress,
        assignedTo: task.assignedTo,
        assignedToId: task.assignedToId,
        description: task.description
      }
    }));

    res.json(events);
  } catch (error) {
    next(error);
  }
};
