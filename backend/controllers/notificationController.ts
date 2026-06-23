import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const notifications = await NotificationService.getNotificationsForUser(currentUser.id);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const notification = await Notification.findById(req.params.id as string);

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    if (
      notification.userId !== 'all' &&
      notification.userId.toString() !== currentUser.id
    ) {
      res.status(403);
      return next(new Error('Not authorized to access this notification'));
    }

    const updated = await NotificationService.markAsRead(req.params.id as string);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const result = await NotificationService.markAllAsRead(currentUser.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
