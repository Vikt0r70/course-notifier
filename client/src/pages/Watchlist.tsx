import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { watchlistService } from '../services/watchlistService';
import { Watchlist } from '../types';
import WatchlistItem from '../components/WatchlistItem';
import NotificationSettingsPanel from '../components/NotificationSettingsPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, Alert, EmptyState } from '../components/ui';

const WatchlistPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery('watchlist', watchlistService.getWatchlist);

  const removeMutation = useMutation(
    (id: number) => watchlistService.removeFromWatchlist(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('watchlist');
        queryClient.invalidateQueries('courses');
        toast.success('Course removed from watchlist!');
      },
    }
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading watchlist..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-zinc-100">My Watchlist</h1>
          <p className="text-zinc-400 mt-1">
            Track courses you're interested in and get notified when they open or close
          </p>
        </div>
      </Card>

      {watchlist && watchlist.length > 0 ? (
        <>
          {/* Global Notification Settings Panel */}
          <NotificationSettingsPanel />

          {/* Tips Alert */}
          <Alert variant="info" title="Tips">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>You'll receive notifications when courses open or close based on your settings above</li>
              <li>These notification settings apply to all your watched courses</li>
              <li>Check your email regularly for the latest updates</li>
            </ul>
          </Alert>

          {/* Watchlist Cards */}
          <div className="space-y-4">
            {watchlist.map((item: Watchlist) => (
              <WatchlistItem
                key={item.id}
                item={item}
                onRemove={(id) => removeMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Summary Footer */}
          <Card className="text-center">
            <p className="text-zinc-400">
              Total courses watched:{' '}
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text font-bold text-2xl">
                {watchlist.length}
              </span>
            </p>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Star className="w-16 h-16" />}
            title="Your watchlist is empty"
            description="You haven't added any courses to your watchlist yet. Browse courses and click the star icon to start tracking them."
            action={{
              label: 'Browse Courses',
              onClick: () => window.location.href = '/dashboard'
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default WatchlistPage;
