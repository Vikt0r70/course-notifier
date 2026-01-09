import { useQuery } from 'react-query';
import { courseService } from '../services/courseService';

export const useCourses = (filters: any) => {
  return useQuery(['courses', filters], () => courseService.getCourses(filters), {
    keepPreviousData: true,
    staleTime: 30000,
  });
};

export const useCourseStats = () => {
  return useQuery('courseStats', courseService.getStats, {
    staleTime: 60000,
  });
};
