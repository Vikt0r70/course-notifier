import api from './api';
import { Course, FilterParams } from '../types';

export interface FilterOptions {
  faculties: string[];
  timeShifts: string[];
  programs: string[];
}

export const courseService = {
  async getCourses(params: FilterParams = {}) {
    const response = await api.get('/courses', { params });
    return response.data.data;
  },

  async getCourseById(id: number): Promise<Course> {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  },

  async getStats() {
    const response = await api.get('/courses/stats');
    return response.data.data;
  },

  async getFaculties(studyType?: string) {
    const response = await api.get('/courses/faculties', {
      params: { studyType },
    });
    return response.data.data;
  },

  async getFilterOptions(studyType?: string, faculty?: string): Promise<FilterOptions> {
    const response = await api.get('/courses/filter-options', {
      params: { studyType, faculty },
    });
    return response.data.data;
  },
};
