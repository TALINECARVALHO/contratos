
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { AppNotification, UserProfile } from '../types';
import { getAppNotifications, markNotificationAsRead, markAllAsRead } from '../services/notificationService';

interface NotificationCenterProps {
  userProfile: UserProfile | null;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userProfile }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInternalControl = userProfile?.email === 'controleinterno.sfp@gmail.com';

  const fetchNotes = async () => {
    // Controle Interno não recebe notificações no sistema
    if (userProfile && !isInternalControl) {
      const isAdmin = userProfile.role === 'admin';
      const data = await getAppNotifications(userProfile.department, isAdmin);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    if (isInternalControl) return; // Não inicia polling para controle interno

    fetchNotes();
    const interval = setInterval(fetchNotes, 60000);
    return () => clearInterval(interval);
  }, [userProfile, isInternalControl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Se for controle interno, não renderiza nada no header (ou renderiza sino vazio/desativado se preferir)
  if (isInternalControl) {
    return (
        <div className="p-2 text-slate-300 opacity-20" title="Notificações desativadas para esta conta">
            <Bell size={20} />
        </div>
    );
  }

  const handleMarkAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllAsRead(unreadIds);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        title="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map(note => (
                  <div 
                    key={note.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors relative group ${!note.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!note.is_read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 mb-1">{note.title}</p>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{note.message}</p>
                        <div className="flex items-center justify-end">
                            {!note.is_read && (
                                <button 
                                  onClick={() => handleMarkAsRead(note.id)}
                                  className="text-xs text-blue-600 flex items-center gap-1 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                                >
                                  <Check size={12} /> Marcar lida
                                </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Bell size={32} className="text-slate-300 mb-2" />
                <p className="text-sm">Nenhuma notificação.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
