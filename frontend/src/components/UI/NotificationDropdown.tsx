import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';

export interface Notification {
  id: string;
  type: 'task-assigned' | 'task-updated' | 'task-completed' | 'task-overdue' | 'task-due-soon' | 'comment-added' | 'task-created' | 'task-deleted';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  timestamp: string;
}

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Écouter les notifications
  useEffect(() => {
    if (!user) return;

    // Connecter au service de notification
    notificationService.connect(user.id, user.role);

    // S'abonner aux notifications
    const unsubscribe = notificationService.onNotification((notification) => {
      const newNotification = {
        ...notification,
        id: Date.now().toString()
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, [user]);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  // Supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (unreadCount > 0) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Cliquer sur une notification
  const handleNotificationClick = (notification: Notification) => {
    // Fermer le dropdown
    setIsOpen(false);
    
    // Naviguer vers la tâche si applicable
    if (notification.data?.taskId) {
      navigate(`/tasks/${notification.data.taskId}`);
    }
    
    // Marquer comme lue
    if (unreadCount > 0) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task-completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task-overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'task-due-soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Formater la date
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-lg text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden notification-dropdown-enter">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto notification-scroll">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                 {notifications.map((notification) => (
                   <div
                     key={notification.id}
                     className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer notification-item-enter`}
                     onClick={() => handleNotificationClick(notification)}
                   >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                                             <button
                         onClick={(e) => {
                           e.stopPropagation();
                           removeNotification(notification.id);
                         }}
                         className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                       >
                         <X className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setNotifications([])}
                className="w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 