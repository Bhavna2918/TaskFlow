import mongoose from 'mongoose';

export interface IComment {
  user: string;
  text: string;
  timestamp: Date;
}

export interface IHistory {
  user: string;
  action: string;
  timestamp: Date;
}

export interface IAttachment {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface ITask extends mongoose.Document {
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string;
  assignedToId: mongoose.Types.ObjectId;
  assignedById?: mongoose.Types.ObjectId;
  assignedBy?: string;
  projectId?: mongoose.Types.ObjectId;
  progress: number;
  category: string;
  deadline: string; // YYYY-MM-DD format
  creator: string;
  labels: string[];
  attachments: IAttachment[];
  comments: IComment[];
  history: IHistory[];
}

const commentSchema = new mongoose.Schema<IComment>({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const historySchema = new mongoose.Schema<IHistory>({
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed'],
      default: 'To Do'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    assignedTo: {
      type: String,
      default: ''
    },
    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign the task to a user']
    },
    assignedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBy: {
      type: String,
      default: ''
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    deadline: {
      type: String,
      required: [true, 'Please add a deadline']
    },
    creator: {
      type: String,
      default: 'Admin'
    },
    labels: [
      {
        type: String
      }
    ],
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    comments: [commentSchema],
    history: [historySchema]
  },
  {
    timestamps: true
  }
);

// Transform output JSON representation
taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    const anyRet = ret as any;
    anyRet.id = anyRet._id.toString();
    delete anyRet._id;
    return anyRet;
  }
});

export default mongoose.model<ITask>('Task', taskSchema);
