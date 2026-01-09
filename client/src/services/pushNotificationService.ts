class PushNotificationService {
  private hasRequestedPermission = false;

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied' && !this.hasRequestedPermission) {
      this.hasRequestedPermission = true;
      try {
        const permission = await Notification.requestPermission();
        localStorage.setItem('notificationPermission', permission);
        return permission;
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return 'denied';
      }
    }

    return Notification.permission;
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isSupported()) return;
    
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: options?.tag || 'course-notifier',
          requireInteraction: false,
          ...options
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window when clicked
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  hasPermission(): boolean {
    return this.getPermission() === 'granted';
  }
}

export default new PushNotificationService();
