import { useEffect, useState, useCallback } from 'react';
import pushNotificationService from '../services/pushNotificationService';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    pushNotificationService.getPermission()
  );
  const [isSupported] = useState(pushNotificationService.isSupported());

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';
    
    const result = await pushNotificationService.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      pushNotificationService.showNotification(title, options);
    }
  }, [permission]);

  // Request permission on first mount with delay
  useEffect(() => {
    if (!isSupported) return;
    
    // Only request if not already decided
    if (permission === 'default') {
      // Wait 5 seconds after page load to avoid annoying users immediately
      const timer = setTimeout(async () => {
        await requestPermission();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, requestPermission]);

  return { 
    permission, 
    isSupported, 
    requestPermission,
    showNotification,
    hasPermission: permission === 'granted'
  };
};
