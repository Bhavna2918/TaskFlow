import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MessageService } from './services/messageService';

let io: Server | null = null;
const userSocketMap = new Map<string, string>(); // Maps userId -> socketId

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user mapping
    socket.on('register_user', (userId: string) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`Registered user ${userId} to socket ${socket.id}`);
        // Broadcast user online status
        io?.emit('user_status_change', { userId, status: 'online' });
      }
    });

    // Handle private chat messages
    socket.on('send_message', async (data: { senderId: string; recipientId: string; text: string }) => {
      const { senderId, recipientId, text } = data;
      try {
        // 1. Save to DB
        const savedMsg = await MessageService.createMessage(senderId, recipientId, text);
        const serialized = savedMsg.toJSON();

        // 2. Emit to recipient socket
        const recipientSocketId = userSocketMap.get(recipientId);
        if (recipientSocketId) {
          io?.to(recipientSocketId).emit('receive_message', serialized);
        }

        // 3. Emit back to sender socket
        socket.emit('message_sent', serialized);
      } catch (err: any) {
        console.error('Failed to handle send_message socket event:', err.message);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { senderId: string; recipientId: string }) => {
      const { senderId, recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io?.to(recipientSocketId).emit('typing', { senderId });
      }
    });

    socket.on('stop_typing', (data: { senderId: string; recipientId: string }) => {
      const { senderId, recipientId } = data;
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io?.to(recipientSocketId).emit('stop_typing', { senderId });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      let disconnectedUserId: string | null = null;
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSocketMap.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io?.emit('user_status_change', { userId: disconnectedUserId, status: 'offline' });
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Push Real-time notification helper
export const sendRealTimeNotification = (userId: string, notification: any) => {
  if (!io) return;
  const socketId = userSocketMap.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('new_notification', notification);
  }
};
