import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-fermeture
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Attendre l'animation de sortie
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-sky-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-sky-50 border-sky-200 text-sky-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-900 border rounded-2xl shadow-2xl transition-all duration-300 ease-in-out flex overflow-hidden',
        getStyles(),
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      )}
    >
      {/* Bandeau coloré à gauche */}
      <div className={cn('w-2', {
        'bg-green-500': type === 'success',
        'bg-red-500': type === 'error',
        'bg-yellow-400': type === 'warning',
        'bg-blue-500': type === 'info',
        'bg-gray-300': !['success','error','warning','info'].includes(type),
      })} />
      <div className="flex items-start p-4 w-full">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold mb-1">{title}</h4>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex-shrink-0 ml-3">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300);
            }}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors rounded-full p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast; 