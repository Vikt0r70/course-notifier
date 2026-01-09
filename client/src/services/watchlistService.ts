import api from './api';
import { Watchlist, SimilarFilter } from '../types';

// Response type for similar course patterns
export interface SimilarPatternsResponse {
  patterns: Array<{ days: string; times: string[]; count: number }>;
  similarCoursesCount: number;
  openCount: number;
  facultyPatternsCount: number;
  similarPatterns: string[]; // Day patterns that have similar courses
  faculty: string;
}

export const watchlistService = {
  async getWatchlist(): Promise<Watchlist[]> {
    const response = await api.get('/watchlist');
    return response.data.data;
  },

  async addToWatchlist(data: any) {
    const response = await api.post('/watchlist', data);
    return response.data;
  },

  async updateSettings(id: number, data: any) {
    const response = await api.put(`/watchlist/${id}`, data);
    return response.data;
  },

  async updateSimilarFilters(id: number, similarFilters: SimilarFilter[], similarFilterNewlyOpened: boolean) {
    const response = await api.put(`/watchlist/${id}`, {
      similarFilters,
      similarFilterNewlyOpened,
    });
    return response.data;
  },

  async getSimilarPatterns(id: number): Promise<SimilarPatternsResponse> {
    const response = await api.get(`/watchlist/${id}/similar-patterns`);
    return response.data.data;
  },

  async removeFromWatchlist(id: number) {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  async checkWatching(courseCode: string, section: string) {
    const response = await api.get('/watchlist/check', {
      params: { courseCode, section },
    });
    return response.data.data.isWatching;
  },
};
