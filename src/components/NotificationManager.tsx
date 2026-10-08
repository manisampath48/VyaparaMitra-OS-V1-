import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, Award, X, Sparkles, Receipt } from 'lucide-react';

export type NotificationType = 'low_stock' | 'invoice' | 'milestone' | 'info' | 'success' | 'error' | 'warning';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // ms
}

interface NotificationContextProps {
  notifications: ToastNotification[];
  triggerNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const triggerNotification = (type: NotificationType, title: string, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: ToastNotification = { id, type, title, message, duration };
    setNotifications(prev => [...prev, newNotif]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, triggerNotification, removeNotification }}>
      {children}
      
      {/* Floating Stack of Glassmorphic Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <ToastCard key={n.id} notification={n} onClose={removeNotification} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

function ToastCard({ notification, onClose }: { notification: ToastNotification; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'low_stock':
      case 'error':
        return (
          <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl border border-red-500/20 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'invoice':
      case 'success':
        return (
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
        );
      case 'milestone':
        return (
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Award className="w-5 h-5 animate-bounce" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        );
    }
  };

  const getAccentColor = () => {
    switch (notification.type) {
      case 'low_stock':
      case 'error':
        return 'border-l-4 border-l-red-500';
      case 'invoice':
      case 'success':
        return 'border-l-4 border-l-emerald-500';
      case 'milestone':
      case 'warning':
        return 'border-l-4 border-l-amber-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`pointer-events-auto bg-white/75 backdrop-blur-xl border border-slate-200/50 shadow-xl shadow-slate-200/40 rounded-2xl p-4 flex gap-3.5 relative overflow-hidden ${getAccentColor()}`}
      id={`toast-${notification.id}`}
    >
      {getIcon()}
      <div className="flex-1 pr-6">
        <h4 className="text-xs font-bold text-slate-800 leading-tight mb-0.5">{notification.title}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{notification.message}</p>
      </div>
      <button 
        onClick={() => onClose(notification.id)}
        className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Glassmorphic animated progress timer line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50">
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
          className={`h-full ${
            notification.type === 'low_stock' || notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'invoice' || notification.type === 'success' ? 'bg-emerald-500' :
            notification.type === 'milestone' || notification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        />
      </div>
    </motion.div>
  );
}
