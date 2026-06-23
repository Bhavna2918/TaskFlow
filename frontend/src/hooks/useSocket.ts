import { useEffect } from 'react';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useToast } from '../context/ToastContext'; // Maintain backward compatibility with the app Toast context if it exists

export const useSocket = () => {
  const { currentUser } = useAuthStore();
  const { addRealTimeNotification } = useNotificationStore();
  const { toast } = useToast() as any;

  useEffect(() => {
    if (!currentUser) {
      socketService.disconnect();
      return;
    }

    const socket = socketService.connect(currentUser.id);

    // Register global listener for notifications
    socket.on('new_notification', (notification: any) => {
      addRealTimeNotification(notification);
      if (toast) {
        toast(`${notification.title}: ${notification.message}`, 'info');
      }
    });

    return () => {
      socket.off('new_notification');
    };
  }, [currentUser, addRealTimeNotification, toast]);

  return socketService;
};
