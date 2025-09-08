import React, { useState, useEffect, useCallback } from 'react';
import Toast, { ToastProps } from './UI/Toast';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Exposer la fonction globalement
  useEffect(() => {
    (window as any).addNotification = addNotification;
    
    return () => {
      delete (window as any).addNotification;
    };
  }, [addNotification]);

  // Gérer les notifications temps réel (quand on aura Socket.io)
  useEffect(() => {
    if (!user) return;

    // Ici on écoutera les notifications Socket.io
    // Pour l'instant, on simule quelques notifications
    const handleRealTimeNotification = (notification: any) => {
      let type: 'success' | 'error' | 'warning' | 'info' = 'info';
      
      switch (notification.type) {
        case 'task-completed':
          type = 'success';
          break;
        case 'task-overdue':
          type = 'error';
          break;
        case 'task-due-soon':
          type = 'warning';
          break;
        default:
          type = 'info';
      }

      addNotification({
        type,
        title: notification.title,
        message: notification.message,
        duration: notification.priority === 'high' ? 8000 : 5000
      });
    };

    // Simuler quelques notifications pour tester
    const testNotifications = [
      {
        type: 'task-assigned',
        title: 'Nouvelle tâche assignée',
        message: 'Vous avez une nouvelle tâche: "Finaliser le rapport"',
        priority: 'medium'
      },
      {
        type: 'task-due-soon',
        title: 'Échéance approchante',
        message: 'La tâche "Révision code" est due demain',
        priority: 'high'
      }
    ];

    // Afficher les notifications de test après 2 secondes
    const timer = setTimeout(() => {
      testNotifications.forEach((notification, index) => {
        setTimeout(() => {
          handleRealTimeNotification(notification);
        }, index * 2000);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, addNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 80}px)`,
            zIndex: 1000 - index 
          }}
        >
          <Toast
            {...notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager; 