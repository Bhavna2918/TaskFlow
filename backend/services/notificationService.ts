import Notification, { INotification } from '../models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
  static async getNotificationsForUser(userId: string): Promise<INotification[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return await Notification.find({
      $or: [
        { userId: userObjectId },
        { userId: 'all' }
      ]
    }).sort({ timestamp: -1 });
  }

  static async markAsRead(notificationId: string): Promise<INotification | null> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return null;
    }
    notification.read = true;
    return await notification.save();
  }

  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.updateMany(
      {
        $or: [
          { userId: userObjectId },
          { userId: 'all' }
        ],
        read: false
      },
      { read: true }
    );
    return { modifiedCount: result.modifiedCount };
  }
}
