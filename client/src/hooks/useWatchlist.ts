import { useQuery, useMutation, useQueryClient } from 'react-query';
import { watchlistService } from '../services/watchlistService';
import toast from 'react-hot-toast';

export const useWatchlist = () => {
  const queryClient = useQueryClient();

  const watchlistQuery = useQuery('watchlist', watchlistService.getWatchlist);

  const addMutation = useMutation(watchlistService.addToWatchlist, {
    onSuccess: () => {
      queryClient.invalidateQueries('watchlist');
      queryClient.invalidateQueries('courses');
      toast.success('تم إضافة المادة لقائمة المتابعة');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل إضافة المادة');
    },
  });

  const removeMutation = useMutation(watchlistService.removeFromWatchlist, {
    onSuccess: () => {
      queryClient.invalidateQueries('watchlist');
      queryClient.invalidateQueries('courses');
      toast.success('تم إزالة المادة من قائمة المتابعة');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => watchlistService.updateSettings(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('watchlist');
        toast.success('تم تحديث الإعدادات');
      },
    }
  );

  return {
    watchlist: watchlistQuery.data,
    isLoading: watchlistQuery.isLoading,
    addToWatchlist: addMutation.mutate,
    removeFromWatchlist: removeMutation.mutate,
    updateSettings: updateMutation.mutate,
  };
};
