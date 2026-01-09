import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { courseService } from '../services/courseService';
import { watchlistService } from '../services/watchlistService';
import { Course, FilterParams } from '../types';
import StatsCards from '../components/StatsCards';
import FilterBar from '../components/FilterBar';
import CourseTable from '../components/CourseTable';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import { Card } from '../components/ui';
import { useAuthStore } from '../store/authStore';

const ITEMS_PER_PAGE = 50;

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Initialize filters with user data if available, otherwise use defaults
  const [filters, setFilters] = useState<FilterParams>(() => ({
    studyType: user?.studyType || 'بكالوريوس',
    faculty: user?.faculty || '',
    timeShift: user?.timeShift || '',
    search: '',
    page: 1,
    limit: 1000, // Fetch more courses for client-side filtering
  }));

  // Update filters when user data loads
  useEffect(() => {
    if (user) {
      setFilters((prev) => ({
        ...prev,
        studyType: user.studyType || 'بكالوريوس',
        faculty: user.faculty || '',
        timeShift: user.studyType === 'دراسات عليا' || user.studyType === 'الدراسات العليا' ? '' : (user.timeShift || ''),
      }));
    }
  }, [user?.id]); // Only update when user changes

  // Fetch filter options dynamically based on selected study type
  const { data: filterOptions } = useQuery(
    ['filterOptions', filters.studyType, filters.faculty],
    () => courseService.getFilterOptions(filters.studyType, filters.faculty),
    { 
      staleTime: 60000, // Cache for 1 minute
    }
  );

  // Fetch courses based on dropdown filters ONLY (not search)
  // This allows search to be instant client-side filtering
  const { data: coursesData, isLoading } = useQuery(
    ['courses', filters.studyType, filters.faculty, filters.timeShift],
    () => courseService.getCourses({
      studyType: filters.studyType,
      faculty: filters.faculty,
      timeShift: filters.timeShift,
      search: '', // Always fetch without search - we filter client-side
      page: 1,
      limit: 1000, // Get all courses for the selected filters
    }),
    {
      staleTime: 30000, // Cache for 30 seconds
      keepPreviousData: true, // Show old data while fetching new
    }
  );

  const { data: stats } = useQuery('courseStats', courseService.getStats);

  // Client-side search filtering - INSTANT, no network request
  const filteredCourses = useMemo(() => {
    const courses = coursesData?.courses || [];
    
    if (!filters.search || !filters.search.trim()) {
      return courses;
    }

    const searchTerms = filters.search.toLowerCase().trim().split(/\s+/);
    
    return courses.filter((course: Course) => {
      const searchableText = [
        course.courseName,
        course.courseCode,
        course.instructor,
        course.section,
      ].filter(Boolean).join(' ').toLowerCase();

      // All search terms must match (AND logic)
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [coursesData?.courses, filters.search]);

  // Client-side pagination of filtered results
  const paginatedCourses = useMemo(() => {
    const currentPage = filters.page || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCourses.slice(startIndex, endIndex);
  }, [filteredCourses, filters.page]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = filteredCourses.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return {
      page: filters.page || 1,
      pages: totalPages,
      total: totalItems,
    };
  }, [filteredCourses.length, filters.page]);

  const toggleWatchMutation = useMutation(
    async (course: Course) => {
      if (course.isWatching) {
        const watchlist = await watchlistService.getWatchlist();
        const item = watchlist.find(
          (w) => w.courseCode === course.courseCode && w.section === course.section
        );
        if (item) await watchlistService.removeFromWatchlist(item.id);
      } else {
        await watchlistService.addToWatchlist({
          courseCode: course.courseCode,
          section: course.section,
          courseName: course.courseName,
          faculty: course.faculty,
          instructor: course.instructor,
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses');
        toast.success('Watchlist updated successfully!');
      },
      onError: () => {
        toast.error('Failed to update watchlist');
      },
    }
  );

  const handleFilterChange = (key: string, value: string) => {
    // When study type changes, reset faculty and timeShift
    if (key === 'studyType') {
      setFilters((prev) => ({ ...prev, studyType: value, faculty: '', timeShift: '', search: '', page: 1 }));
    } 
    // When faculty changes, reset page
    else if (key === 'faculty') {
      setFilters((prev) => ({ ...prev, faculty: value, page: 1 }));
    }
    // When search changes, reset to page 1 (but no network request!)
    else if (key === 'search') {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }
    else {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && !coursesData) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Dashboard</h1>
        <p className="text-zinc-400">Browse and search available courses at Zarqa University</p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={{
          total: stats?.total || 0,
          open: stats?.open || 0,
          closed: stats?.closed || 0,
          searched: filteredCourses.length,
        }}
      />

      {/* Filter Bar */}
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        filterOptions={filterOptions}
      />

      {/* Course Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-zinc-100">Search Results</h2>
          <div className="text-sm text-zinc-400">
            Showing{' '}
            <span className="text-cyan-400 font-medium">{paginatedCourses.length}</span>
            {' '}of{' '}
            <span className="text-cyan-400 font-medium">{filteredCourses.length}</span>
            {' '}courses
            {filters.search && (
              <span className="text-zinc-500"> (filtered from {coursesData?.courses?.length || 0})</span>
            )}
          </div>
        </div>

        <CourseTable 
          courses={paginatedCourses} 
          onToggleWatch={(course) => toggleWatchMutation.mutate(course)} 
        />

        {paginationInfo.pages > 1 && (
          <Pagination
            currentPage={paginationInfo.page}
            totalPages={paginationInfo.pages}
            onPageChange={handlePageChange}
          />
        )}
      </Card>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />
    </div>
  );
};

export default Dashboard;
