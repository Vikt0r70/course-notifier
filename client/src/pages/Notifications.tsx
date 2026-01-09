import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Bell, CheckCheck, Clock, Target, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../components/ui/utils';

// Trigger source types matching backend
type TriggerSource = 'direct_watch' | 'similar_course' | 'newly_opened';

interface NotificationWithTrigger {
  id: number;
  userId: number;
  courseCode: string;
  section: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  triggerSources?: TriggerSource[];
}

// Trigger badge component
const TriggerBadge: React.FC<{ source: TriggerSource }> = ({ source }) => {
  const config: Record<TriggerSource, { label: string; icon: React.ReactNode; variant: 'info' | 'warning' | 'success' }> = {
    direct_watch: {
      label: 'مراقبة مباشرة',
      icon: <Target className="w-3 h-3" />,
      variant: 'info',
    },
    similar_course: {
      label: 'شعبة بديلة',
      icon: <RefreshCw className="w-3 h-3" />,
      variant: 'warning',
    },
    newly_opened: {
      label: 'فتحت حديثاً',
      icon: <Sparkles className="w-3 h-3" />,
      variant: 'success',
    },
  };

  const { label, icon, variant } = config[source];

  return (
    <Badge variant={variant} size="sm" icon={icon}>
      {label}
    </Badge>
  );
};

// Parse trigger sources from message (temporary until backend sends them)
const parseTriggerSources = (message: string): TriggerSource[] => {
  const sources: TriggerSource[] = [];
  
  if (message.includes('مراقبة مباشرة') || message.includes('🎯')) {
    sources.push('direct_watch');
  }
  if (message.includes('شعبة بديلة') || message.includes('🔄') || message.includes('بديلة')) {
    sources.push('similar_course');
  }
  if (message.includes('فتحت حديثاً') || message.includes('🆕')) {
    sources.push('newly_opened');
  }
  
  // Default to direct watch if no triggers found
  if (sources.length === 0) {
    sources.push('direct_watch');
  }
  
  return sources;
};

// Group notifications by date
const groupByDate = (notifications: NotificationWithTrigger[]): Map<string, NotificationWithTrigger[]> => {
  const groups = new Map<string, NotificationWithTrigger[]>();
  
  notifications.forEach(n => {
    const date = new Date(n.createdAt);
    let key: string;
    
    if (isToday(date)) {
      key = 'اليوم';
    } else if (isYesterday(date)) {
      key = 'أمس';
    } else {
      key = format(date, 'EEEE, d MMMM yyyy', { locale: ar });
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(n);
  });
  
  return groups;
};

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'opened' | 'closed'>('all');
  
  // Fetch all notifications (including read) when filter is 'all', 'opened', or 'closed'
  const includeRead = filter !== 'unread';
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications(includeRead);

  // Filter notifications
  const filteredNotifications = (notifications as NotificationWithTrigger[]).filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'opened') return n.type === 'opened';
    if (filter === 'closed') return n.type === 'closed';
    return true;
  });

  // Group by date
  const groupedNotifications = groupByDate(filteredNotifications);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Bell className="w-7 h-7 text-cyan-400" />
            الإشعارات
          </h1>
          <p className="text-zinc-400 mt-1">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        {[
          { value: 'all', label: 'الكل' },
          { value: 'unread', label: 'غير مقروء' },
          { value: 'opened', label: 'فتحت' },
          { value: 'closed', label: 'أغلقت' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              filter === tab.value
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            )}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="لا توجد إشعارات"
          description={filter === 'unread' ? 'جميع الإشعارات مقروءة' : 'لم تتلقَ أي إشعارات بعد'}
        />
      ) : (
        <div className="space-y-8">
          {Array.from(groupedNotifications.entries()).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {date}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* Notification Cards */}
              <div className="space-y-3">
                {items.map((notification) => {
                  const triggerSources = notification.triggerSources || parseTriggerSources(notification.message);
                  const isOpened = notification.type === 'opened';
                  
                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        'p-4 transition-all cursor-pointer hover:bg-zinc-800/70',
                        !notification.isRead && 'bg-zinc-800/50 border-l-4 border-l-cyan-500'
                      )}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Status Indicator */}
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                          isOpened ? 'bg-green-500/20' : 'bg-red-500/20'
                        )}>
                          <span className="text-2xl">{isOpened ? '🟢' : '🔴'}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Course Info */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-zinc-100">
                              {notification.courseCode}
                            </span>
                            <span className="text-zinc-500">-</span>
                            <span className="text-zinc-300">
                              شعبة {notification.section}
                            </span>
                            <Badge 
                              variant={isOpened ? 'success' : 'danger'} 
                              size="sm"
                            >
                              {isOpened ? 'فتحت' : 'أغلقت'}
                            </Badge>
                          </div>

                          {/* Message */}
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Trigger Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {triggerSources.map((source) => (
                              <TriggerBadge key={source} source={source} />
                            ))}
                          </div>
                        </div>

                        {/* Time & Read Status */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 text-right">
                          <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
