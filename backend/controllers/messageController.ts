import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/messageService';
import Message from '../models/Message';

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const messages = await MessageService.getMessagesForUser(currentUser.id);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const { recipientId, text } = req.body;

    const newMessage = await MessageService.createMessage(currentUser.id, recipientId, text);
    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = (req as any).user;
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      return next(new Error('Message not found'));
    }

    if (
      message.senderId.toString() !== currentUser.id &&
      message.receiverId.toString() !== currentUser.id
    ) {
      res.status(403);
      return next(new Error('Not authorized to access this message'));
    }

    if (req.body.read !== undefined) {
      message.read = req.body.read;
    }

    if (req.body.text !== undefined) {
      message.message = req.body.text;
    }

    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } catch (error) {
    next(error);
  }
};
