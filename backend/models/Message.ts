import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  timestamp: Date;
  recipientId?: string;
  text?: string;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Virtual getter and setter for compatibility with frontend which uses recipientId and text
messageSchema.virtual('recipientId')
  .get(function (this: IMessage) {
    return this.receiverId ? this.receiverId.toString() : '';
  })
  .set(function (this: IMessage, value: string) {
    this.receiverId = new mongoose.Types.ObjectId(value);
  });

messageSchema.virtual('text')
  .get(function (this: IMessage) {
    return this.message;
  })
  .set(function (this: IMessage, value: string) {
    this.message = value;
  });

// Transform output JSON representation
messageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    const anyRet = ret as any;
    anyRet.id = anyRet._id.toString();
    delete anyRet._id;
    return anyRet;
  }
});

export default mongoose.model<IMessage>('Message', messageSchema);
