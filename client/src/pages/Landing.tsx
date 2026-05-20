import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { courseService } from '../services/courseService';
import { FilterParams } from '../types';
import StatsCards from '../components/StatsCards';
import FilterBar from '../components/FilterBar';
import CourseTable from '../components/CourseTable';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const [filters, setFilters] = useState<FilterParams>({
    studyType: 'بكالوريوس',
    faculty: '',
    timeShift: '',
    search: '',
    page: 1,
    limit: 1000,
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search || ''), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const { data: filterOptions } = useQuery(
    ['filterOptions', filters.studyType, filters.faculty],
    () => courseService.getFilterOptions(filters.studyType, filters.faculty),
    { staleTime: 60000 }
  );

  const { data: coursesData, isLoading } = useQuery(
    ['courses', filters.studyType, filters.faculty, filters.timeShift, debouncedSearch],
    () => courseService.getCourses({
      studyType: filters.studyType,
      faculty: filters.faculty,
      timeShift: filters.timeShift,
      search: debouncedSearch,
      page: 1,
      limit: 1000,
    }),
    { staleTime: 30000, keepPreviousData: true }
  );

  const { data: stats } = useQuery('courseStats', courseService.getStats);

  const filteredCourses = useMemo(() => {
    return coursesData?.courses || [];
  }, [coursesData?.courses]);

  const paginatedCourses = useMemo(() => {
    const page = filters.page || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, filters.page]);

  const paginationInfo = useMemo(() => {
    const total = filteredCourses.length;
    return {
      page: filters.page || 1,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
      total,
    };
  }, [filteredCourses.length, filters.page]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'studyType') {
      setFilters(prev => ({ ...prev, studyType: value, faculty: '', timeShift: '', search: '', page: 1 }));
    } else if (key === 'faculty') {
      setFilters(prev => ({ ...prev, faculty: value, timeShift: '', page: 1 }));
    } else if (key === 'search') {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStarClick = () => {
    toast('Sign in to track courses and get notifications', {
      icon: '🔔',
      duration: 4000,
    });
  };

  if (isLoading && !coursesData) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section - only for unauthenticated users */}
      {!isAuthenticated && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950 border border-zinc-800/50 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-cyan-400 tracking-wide">Zarqa University</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-100 mb-4 leading-tight">
              Track Course Availability
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Get Instant Notifications
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mb-8">
              Browse available courses at Zarqa University, add them to your watchlist,
              and receive instant notifications when courses open or close.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800/50 text-zinc-200 font-medium rounded-xl border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

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
          <h2 className="text-xl font-bold text-zinc-100">Available Courses</h2>
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
          onToggleWatch={handleStarClick}
        />

        {paginationInfo.pages > 1 && (
          <Pagination
            currentPage={paginationInfo.page}
            totalPages={paginationInfo.pages}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
    </div>
  );
};

export default Landing;
