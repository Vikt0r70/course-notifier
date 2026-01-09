import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';

export const useNotifications = (includeRead: boolean = false) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery(
    ['notifications', includeRead],
    () => notificationService.getNotifications(includeRead),
    {
      refetchInterval: 60000,
    }
  );

  const markAsReadMutation = useMutation(notificationService.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
    },
  });

  const markAllAsReadMutation = useMutation(notificationService.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: notificationsQuery.data?.filter((n: any) => !n.isRead).length || 0,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch: notificationsQuery.refetch,
  };
};
