import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Para evitar que se amontonen, solo mostramos la notificación más reciente
    setNotifications([{ id, type, title, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[90%] max-w-sm">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`
              pointer-events-auto flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out
              ${n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 shadow-[0_4px_30px_rgba(16,185,129,0.15)]' : ''}
              ${n.type === 'error' ? 'bg-red-950/90 border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.15)]' : ''}
              ${n.type === 'info' ? 'bg-blue-950/90 border-blue-500/30 shadow-[0_4px_30px_rgba(59,130,246,0.15)]' : ''}
            `}
          >
            <div className={`flex-shrink-0 mt-0.5 rounded-full p-1.5 ${
              n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
              n.type === 'error' ? 'bg-red-500/20 text-red-400' : 
              'bg-blue-500/20 text-blue-400'
            }`}>
              {n.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : n.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${
                n.type === 'success' ? 'text-emerald-100' : 
                n.type === 'error' ? 'text-red-100' : 
                'text-blue-100'
              }`}>
                {n.title}
              </h4>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">{n.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(n.id)}
              className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1"
              aria-label="Cerrar notificación"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
