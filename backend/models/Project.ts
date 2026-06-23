import mongoose from 'mongoose';

export interface IProject extends mongoose.Document {
  name: string;
  description?: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  tasks: mongoose.Types.ObjectId[];
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Transform output JSON representation
projectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    const anyRet = ret as any;
    anyRet.id = anyRet._id.toString();
    delete anyRet._id;
    return anyRet;
  }
});

export default mongoose.model<IProject>('Project', projectSchema);
