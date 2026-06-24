import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private baseURL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api','') 
    :'http://localhost:5000';

  connect(userId: string): Socket {
    if (this.socket?.connected) {
      this.socket.emit('register_user', userId);
      return this.socket;
    }

    this.socket = io(this.baseURL, {
      withCredentials: true,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket?.id);
      this.socket?.emit('register_user', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  sendMessage(senderId: string, recipientId: string, text: string) {
    this.socket?.emit('send_message', { senderId, recipientId, text });
  }

  emitTyping(senderId: string, recipientId: string) {
    this.socket?.emit('typing', { senderId, recipientId });
  }

  emitStopTyping(senderId: string, recipientId: string) {
    this.socket?.emit('stop_typing', { senderId, recipientId });
  }
}

export default new SocketService();
