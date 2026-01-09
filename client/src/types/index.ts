export interface User {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  faculty: string;
  studyType: string;
  timeShift?: string;
  major?: string; // Now optional for graduate students
  age?: number; // Now optional
  // Global notification settings
  notifyOnOpen?: boolean;
  notifyOnClose?: boolean;
  notifyOnSimilarCourse?: boolean;
  notifyByEmail?: boolean;
  notifyByWeb?: boolean;
  notifyByPhone?: boolean;
}

// Global notification settings type for API updates
export interface NotificationSettings {
  notifyOnOpen: boolean;
  notifyOnClose: boolean;
  notifyOnSimilarCourse: boolean;
  notifyByEmail: boolean;
  notifyByWeb: boolean;
  notifyByPhone: boolean;
}

export interface Course {
  id: number;
  courseCode: string;
  section: string;
  courseName: string;
  creditHours: string;
  room: string;
  instructor: string;
  days: string;
  time: string;
  teachingMethod: string;
  status: string;
  isOpen: boolean;
  faculty: string;
  studyType: string;
  timeShift?: string;
  period?: string;
  lastUpdated: string;
  isWatching?: boolean;
}

// Similar course filter - days pattern + times for that pattern
export interface SimilarFilter {
  days: string;
  times: string[];
}

export interface Watchlist {
  id: number;
  userId: number;
  courseCode: string;
  section: string;
  courseName: string;
  faculty?: string;
  instructor?: string;
  addedAt: string;
  currentStatus?: string;
  currentRoom?: string;
  currentTime?: string;
  currentDays?: string;
  // New filter fields for similar courses
  similarFilters?: SimilarFilter[];
  similarFilterNewlyOpened?: boolean;
}

export interface Notification {
  id: number;
  userId: number;
  courseCode: string;
  section: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface FilterParams {
  studyType?: string;
  faculty?: string;
  timeShift?: string;
  search?: string;
  page?: number;
  limit?: number;
}
