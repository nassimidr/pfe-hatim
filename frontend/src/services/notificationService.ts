import { io, Socket } from 'socket.io-client';

export interface Notification {
  type: 'task-assigned' | 'task-updated' | 'task-completed' | 'task-overdue' | 'task-due-soon' | 'comment-added' | 'task-created' | 'task-deleted';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  timestamp: string;
}

export interface NotificationCallback {
  (notification: Notification): void;
}

class NotificationService {
  private socket: Socket | null = null;
  private callbacks: NotificationCallback[] = [];
  private isConnected = false;

  // Initialiser la connexion Socket.io
  connect(userId: string, userRole: string) {
    if (this.socket) {
      this.disconnect();
    }

    // Connexion au serveur Socket.io
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('🔌 Connected to notification server');
      this.isConnected = true;
      
      // Rejoindre la salle utilisateur
      this.socket?.emit('join-user', userId);
      
      // Rejoindre la salle admin si nécessaire
      if (userRole === 'admin') {
        this.socket?.emit('join-admin', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
    });

    // Écouter les notifications
    this.socket.on('notification', (notification: Notification) => {
      console.log('🔔 Received notification:', notification);
      this.handleNotification(notification);
    });
  }

  // Déconnecter
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Ajouter un callback pour les notifications
  onNotification(callback: NotificationCallback) {
    this.callbacks.push(callback);
    
    // Retourner une fonction pour supprimer le callback
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Gérer une notification reçue
  private handleNotification(notification: Notification) {
    // Appeler tous les callbacks enregistrés
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });

    // Afficher la notification toast si le navigateur le supporte
    this.showToastNotification(notification);
  }

  // Afficher une notification toast
  private showToastNotification(notification: Notification) {
    // Vérifier si le navigateur supporte les notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    // Demander la permission si nécessaire
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(notification);
        }
      });
    } else if (Notification.permission === 'granted') {
      this.createNotification(notification);
    }
  }

  // Créer une notification desktop
  private createNotification(notification: Notification) {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/vite.svg', // Icône de votre app
      badge: '/vite.svg',
      tag: notification.type,
      requireInteraction: notification.priority === 'high',
      silent: false,
    });

    // Fermer automatiquement après 5 secondes (sauf si high priority)
    if (notification.priority !== 'high') {
      setTimeout(() => {
        desktopNotification.close();
      }, 5000);
    }

    // Gérer le clic sur la notification
    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
      
      // Navigation vers la tâche si applicable
      if (notification.data?.taskId) {
        window.location.href = `/tasks/${notification.data.taskId}`;
      }
    };
  }

  // Émettre un événement (pour les actions utilisateur)
  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Vérifier si connecté
  get connected() {
    return this.isConnected;
  }

  // Obtenir le socket (pour usage avancé)
  get socketInstance() {
    return this.socket;
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService; 