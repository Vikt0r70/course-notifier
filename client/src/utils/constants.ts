export const FACULTIES_AR = {
  bachelor: [
    'الشريعة',
    'الآداب',
    'العلوم',
    'تكنولوجيا المعلومات',
    'الاقتصاد والعلوم الإدارية',
    'العلوم التربوية',
    'الحقوق',
    'العلوم الطبية المساندة',
    'التمريض',
    'الهندسة التكنولوجية',
    'الصيدلة',
    'الفنون والتصميم',
    'الإعلام',
    'طب الأسنان',
  ],
  graduate: ['ماجستير', 'دبلوم عالي'],
};

export const STUDY_TYPES = ['بكالوريوس', 'دراسات عليا'];

export const TIME_SHIFTS = ['صباحي', 'مسائي'];

export const TEACHING_METHODS = ['وجاهي', 'مدمج', 'عن بعد'];

export const NOTIFICATION_TYPES = {
  opened: 'فتح المادة',
  closed: 'إغلاق المادة',
  reminder: 'تذكير',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  COURSES: {
    LIST: '/courses',
    STATS: '/courses/stats',
    FACULTIES: '/courses/faculties',
    BY_ID: '/courses/:id',
  },
  WATCHLIST: {
    LIST: '/watchlist',
    ADD: '/watchlist',
    UPDATE: '/watchlist/:id',
    DELETE: '/watchlist/:id',
    CHECK: '/watchlist/check',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    WATCHLISTS: '/admin/watchlists',
    SCRAPER_RUN: '/admin/scraper/run',
    SCRAPER_LOGS: '/admin/scraper/logs',
    SETTINGS: '/admin/settings',
    EMAIL_TEST: '/admin/email/test',
  },
};
