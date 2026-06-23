import Message, { IMessage } from '../models/Message';
import mongoose from 'mongoose';

export class MessageService {
  static async getMessagesForUser(userId: string): Promise<IMessage[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return await Message.find({
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId }
      ]
    }).sort({ timestamp: 1 });
  }

  static async createMessage(senderId: string, recipientId: string, text: string): Promise<IMessage> {
    const newMessage = await Message.create({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(recipientId),
      message: text
    });

    return newMessage;
  }

  static async updateMessageReadStatus(messageId: string, read: boolean): Promise<IMessage | null> {
    const message = await Message.findById(messageId);
    if (!message) {
      return null;
    }
    message.read = read;
    return await message.save();
  }
}
