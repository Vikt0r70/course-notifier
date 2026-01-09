import React, { useState } from 'react';
import { Watchlist } from '../types';
import { 
  Star, 
  Trash2, 
  User,
  Building2,
  Filter,
  Sparkles,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import SimilarFiltersModal from './SimilarFiltersModal';

interface WatchlistItemProps {
  item: Watchlist;
  onRemove: (id: number) => void;
}

const WatchlistItem: React.FC<WatchlistItemProps> = ({ item, onRemove }) => {
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const hasFilters = (item.similarFilters && item.similarFilters.length > 0) || item.similarFilterNewlyOpened;
  const filterCount = item.similarFilters?.length || 0;

  return (
    <>
      <Card variant="hover" className="group rtl-content">
        {/* Main Content - RTL */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Course Info */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">
                  {item.courseCode} - شعبة {item.section}
                </h3>
                <p className="text-zinc-400 text-sm">{item.courseName}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {item.instructor && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span>{item.instructor}</span>
                </div>
              )}
              {item.faculty && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  <span>{item.faculty}</span>
                </div>
              )}
              {item.currentDays && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>{item.currentDays}</span>
                </div>
              )}
              {item.currentTime && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>{item.currentTime}</span>
                </div>
              )}
            </div>

            {/* Current Status & Filters */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {item.currentStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">الحالة:</span>
                  <Badge variant={item.currentStatus === 'Open' ? 'success' : 'danger'}>
                    {item.currentStatus === 'Open' ? 'مفتوح' : 'مغلق'}
                  </Badge>
                </div>
              )}
              
              {/* Filter indicators */}
              {hasFilters && (
                <div className="flex items-center gap-2">
                  {filterCount > 0 && (
                    <Badge variant="info" size="sm">
                      <Filter className="w-3 h-3 ml-1" />
                      {filterCount} فلتر
                    </Badge>
                  )}
                  {item.similarFilterNewlyOpened && (
                    <Badge variant="warning" size="sm">
                      <Sparkles className="w-3 h-3 ml-1" />
                      جديدة فقط
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2 ltr-content">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFiltersModal(true)}
              className="text-cyan-400 hover:text-cyan-300"
              icon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Remove
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters Modal */}
      <SimilarFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        watchlistItem={item}
      />
    </>
  );
};

export default WatchlistItem;
