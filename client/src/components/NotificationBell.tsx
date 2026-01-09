import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { showNotification, hasPermission } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(unreadCount);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Show browser push notification when new notifications arrive
  useEffect(() => {
    if (hasPermission && unreadCount > prevUnreadCountRef.current && notifications.length > 0) {
      const latestNotification = notifications[0];
      
      if (latestNotification && !latestNotification.isRead) {
        showNotification('Course Status Update', {
          body: latestNotification.message,
          tag: `notification-${latestNotification.id}`,
        });
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, notifications, hasPermission, showNotification]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-glass z-50 max-h-96 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center">
            <h3 className="font-semibold text-zinc-100">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()} 
                className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-zinc-800/30' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-zinc-200 text-sm">
                        {notification.courseCode} - Section {notification.section}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
