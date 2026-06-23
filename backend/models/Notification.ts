import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId | string;
  type: 'task_assigned' | 'deadline_near' | 'status_updated' | 'completed' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId ref User, or string "all"
      required: true
    },
    type: {
      type: String,
      enum: ['task_assigned', 'deadline_near', 'status_updated', 'completed', 'announcement'],
      default: 'announcement'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

// Transform output JSON representation
notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    const anyRet = ret as any;
    anyRet.id = anyRet._id.toString();
    delete anyRet._id;
    return anyRet;
  }
});

export default mongoose.model<INotification>('Notification', notificationSchema);
