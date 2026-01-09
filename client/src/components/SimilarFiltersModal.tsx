import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Trash2, Filter, Sparkles, Clock, Calendar, Loader2, Info, Building2 } from 'lucide-react';
import { watchlistService, SimilarPatternsResponse } from '../services/watchlistService';
import { Watchlist, SimilarFilter } from '../types';
import { Button, Toggle, Badge, Spinner } from './ui';
import { cn } from './ui/utils';
import toast from 'react-hot-toast';

interface SimilarFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistItem: Watchlist;
}

// Helper to get full day names in Arabic
const getDayFullNames = (days: string): string => {
  const dayMap: Record<string, string> = {
    'ح': 'أحد',
    'ن': 'اثنين',
    'ث': 'ثلاثاء',
    'ر': 'أربعاء',
    'خ': 'خميس',
    'ج': 'جمعة',
    'س': 'سبت',
  };
  
  return days.split(' ')
    .map(d => dayMap[d] || d)
    .join('، ');
};

const SimilarFiltersModal: React.FC<SimilarFiltersModalProps> = ({ isOpen, onClose, watchlistItem }) => {
  const queryClient = useQueryClient();
  
  // Local state for editing
  const [filters, setFilters] = useState<SimilarFilter[]>(watchlistItem.similarFilters || []);
  const [newlyOpenedOnly, setNewlyOpenedOnly] = useState(watchlistItem.similarFilterNewlyOpened || false);
  const [selectedDays, setSelectedDays] = useState<string>('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  // Fetch available patterns
  const { data: patternsData, isLoading: loadingPatterns } = useQuery<SimilarPatternsResponse>(
    ['similarPatterns', watchlistItem.id],
    () => watchlistService.getSimilarPatterns(watchlistItem.id),
    { enabled: isOpen }
  );

  // Save mutation
  const saveMutation = useMutation(
    () => watchlistService.updateSimilarFilters(watchlistItem.id, filters, newlyOpenedOnly),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('watchlist');
        toast.success('تم حفظ الفلاتر بنجاح');
        onClose();
      },
      onError: () => {
        toast.error('فشل حفظ الفلاتر');
      },
    }
  );

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(watchlistItem.similarFilters || []);
      setNewlyOpenedOnly(watchlistItem.similarFilterNewlyOpened || false);
      setSelectedDays('');
      setSelectedTimes([]);
    }
  }, [isOpen, watchlistItem]);

  // Get available times for selected days pattern
  const availableTimesForDays = patternsData?.patterns.find(p => p.days === selectedDays)?.times || [];

  // Check if a pattern has similar courses
  const hasSimilarCourses = (days: string) => patternsData?.similarPatterns?.includes(days) || false;

  // Add a new filter
  const handleAddFilter = () => {
    if (!selectedDays || selectedTimes.length === 0) return;

    // Check if filter for this days pattern already exists
    const existingIndex = filters.findIndex(f => f.days === selectedDays);
    
    if (existingIndex >= 0) {
      // Merge times with existing filter
      const existingTimes = new Set(filters[existingIndex].times);
      selectedTimes.forEach(t => existingTimes.add(t));
      
      const newFilters = [...filters];
      newFilters[existingIndex] = { days: selectedDays, times: Array.from(existingTimes) };
      setFilters(newFilters);
    } else {
      // Add new filter
      setFilters([...filters, { days: selectedDays, times: selectedTimes }]);
    }

    // Reset selection
    setSelectedDays('');
    setSelectedTimes([]);
  };

  // Remove a filter
  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Remove a specific time from a filter
  const handleRemoveTime = (filterIndex: number, time: string) => {
    const newFilters = [...filters];
    newFilters[filterIndex].times = newFilters[filterIndex].times.filter(t => t !== time);
    
    // If no times left, remove the entire filter
    if (newFilters[filterIndex].times.length === 0) {
      newFilters.splice(filterIndex, 1);
    }
    
    setFilters(newFilters);
  };

  // Toggle time selection
  const toggleTimeSelection = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  // Select all times for the selected days
  const selectAllTimes = () => {
    setSelectedTimes([...availableTimesForDays]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Filter className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">فلترة الشعب البديلة</h2>
              <p className="text-sm text-zinc-400 rtl-content">{watchlistItem.courseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loadingPatterns ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !patternsData?.patterns?.length ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">لا توجد أنماط متاحة في هذه الكلية</p>
            </div>
          ) : (
            <>
              {/* Faculty Info */}
              <div className="flex items-center gap-2 p-3 bg-zinc-800/30 rounded-xl border border-zinc-800">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-zinc-300 rtl-content">
                  الكلية: <span className="font-medium text-zinc-100">{patternsData?.faculty || 'غير محدد'}</span>
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-zinc-100">{patternsData?.similarCoursesCount}</p>
                  <p className="text-sm text-zinc-400">شعبة بديلة</p>
                </div>
                <div className="w-px h-12 bg-zinc-700" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{patternsData?.openCount}</p>
                  <p className="text-sm text-zinc-400">مفتوحة حالياً</p>
                </div>
                <div className="w-px h-12 bg-zinc-700" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{patternsData?.facultyPatternsCount}</p>
                  <p className="text-sm text-zinc-400">نمط أيام متاح</p>
                </div>
              </div>

              {/* Newly Opened Toggle */}
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                <Toggle
                  checked={newlyOpenedOnly}
                  onChange={setNewlyOpenedOnly}
                  label="فقط الشعب التي فتحت حديثاً"
                  description="إشعار فقط عند فتح شعب جديدة (وليس الشعب المفتوحة مسبقاً)"
                  icon={Sparkles}
                />
              </div>

              {/* Current Filters */}
              {filters.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    الفلاتر النشطة ({filters.length})
                  </p>
                  <div className="space-y-2">
                    {filters.map((filter, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span className="font-medium text-zinc-200 rtl-content">
                              {filter.days || 'غير محدد'}
                              <span className="text-zinc-500 text-sm mr-2">({getDayFullNames(filter.days)})</span>
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveFilter(index)}
                            className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 rtl-content">
                          {filter.times.map((time) => (
                            <Badge
                              key={time}
                              variant="info"
                              size="sm"
                              className="cursor-pointer hover:bg-red-500/20 group"
                              onClick={() => handleRemoveTime(index, time)}
                            >
                              <Clock className="w-3 h-3 ml-1" />
                              {time}
                              <X className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Filter */}
              <div className="space-y-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  إضافة فلتر جديد
                </p>

                {/* Days Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">اختر نمط الأيام:</label>
                  <p className="text-xs text-zinc-500 mt-1 mb-2">
                    (الأعداد تمثل جميع المواد في الكلية وليس هذه المادة فقط)
                  </p>
                  <div className="flex flex-wrap gap-2 rtl-content">
                    {patternsData?.patterns.map((pattern) => {
                      const hasSimCourses = hasSimilarCourses(pattern.days);
                      return (
                        <button
                          key={pattern.days}
                          onClick={() => {
                            setSelectedDays(pattern.days);
                            setSelectedTimes([]);
                          }}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                            selectedDays === pattern.days
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                              : hasSimCourses
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent'
                          )}
                        >
                          <span className="flex flex-col items-center gap-1">
                            <span>{pattern.days || 'غير محدد'}</span>
                            <span className="text-xs opacity-70">({pattern.count} مادة)</span>
                          </span>
                          {hasSimCourses && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {patternsData?.similarPatterns && patternsData.similarPatterns.length > 0 && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
                      الأنماط الخضراء لديها شعب بديلة متاحة حالياً
                    </p>
                  )}
                </div>

                {/* Times Selection (shown after days selected) */}
                {selectedDays && availableTimesForDays.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-400">اختر الأوقات المناسبة:</label>
                      <button
                        onClick={selectAllTimes}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        تحديد الكل
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 rtl-content">
                      {availableTimesForDays.map((time) => (
                        <button
                          key={time}
                          onClick={() => toggleTimeSelection(time)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            selectedTimes.includes(time)
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent'
                          )}
                        >
                          <Clock className="w-3 h-3 inline-block ml-1" />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Button */}
                {selectedDays && selectedTimes.length > 0 && (
                  <Button
                    onClick={handleAddFilter}
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    إضافة الفلتر
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-amber-300 rtl-content">
                  <strong>ملاحظة:</strong> الفلاتر تحدد أي شعب بديلة ستتلقى إشعارات عنها. 
                  إذا لم تضف أي فلتر، ستتلقى إشعارات عن جميع الشعب البديلة.
                  <br />
                  <span className="text-amber-400/80">الأنماط المعروضة مبنية على جميع المواد في نفس الكلية.</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isLoading}
            icon={saveMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {saveMutation.isLoading ? 'جاري الحفظ...' : 'حفظ الفلاتر'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimilarFiltersModal;
