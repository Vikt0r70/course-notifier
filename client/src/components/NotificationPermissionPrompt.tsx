import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from './ui';

const NotificationPermissionPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Show prompt if permission is default and user hasn't dismissed it before
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (currentPermission === 'default' && !dismissed) {
      // Show after a delay so it doesn't appear immediately on page load
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setShow(false);
        // Show a test notification
        new Notification('Course Notifier', {
          body: '🎉 Notifications enabled! You\'ll be notified when courses open.',
          icon: '/favicon.ico',
        });
      } else if (result === 'denied') {
        setShow(false);
        localStorage.setItem('notification-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!show || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="relative max-w-sm">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
        
        {/* Card */}
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl p-5">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Dismiss notification prompt"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                Enable Notifications
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Get instant alerts when courses you're watching become available!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={handleRequestPermission}
              icon={<Check className="w-4 h-4" />}
              className="flex-1"
            >
              Enable
            </Button>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-zinc-600 mt-3 text-center">
            You can change this anytime in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
