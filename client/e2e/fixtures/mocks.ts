import { Page } from '@playwright/test';

const testUser = {
  id: 1,
  email: 'student@university.edu',
  username: 'Test Student',
  isAdmin: false,
  isEmailVerified: true,
  faculty: 'الهندسة',
  studyType: 'بكالوريوس',
  timeShift: 'صباحي',
  major: 'علوم الحاسوب',
  onboardingCompleted: true,
  avatarUrl: null,
  notifyOnOpen: true,
  notifyOnClose: false,
  notifyOnSimilarCourse: true,
  notifyByEmail: true,
  notifyByWeb: true,
};

const testCourses = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  courseCode: `CS${101 + i}`,
  section: `${i + 1}`,
  courseName: `مقدمة في البرمجة ${i + 1}`,
  creditHours: '3',
  room: `قاعة ${201 + i}`,
  instructor: `د. أحمد ${i + 1}`,
  days: 'أحد ثلاثاء',
  time: '10:00 - 11:30',
  teachingMethod: 'حضوري',
  status: i % 2 === 0 ? 'مفتوحة' : 'مغلقة',
  isOpen: i % 2 === 0,
  faculty: 'الهندسة',
  studyType: 'بكالوريوس',
  timeShift: 'صباحي',
  period: '2025',
  lastUpdated: new Date().toISOString(),
}));

const filterOptions = {
  faculties: [
    { id: 1, name: 'الهندسة' },
    { id: 2, name: 'تقنية المعلومات' },
    { id: 3, name: 'العلوم' },
  ],
  programs: [
    { id: 1, name: 'ماجستير' },
    { id: 2, name: 'دبلوم عالي' },
  ],
  timeShifts: ['صباحي', 'مسائي'],
};

export const profile = testUser;
export const courses = testCourses;
export const filters = filterOptions;

export async function mockAuthEndpoints(page: Page) {
  await page.route('**/api/auth/profile', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: testUser }) });
  });

  await page.route('**/api/auth/notification-settings', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          notifyOnOpen: true,
          notifyOnClose: false,
          notifyOnSimilarCourse: true,
          notifyByEmail: true,
          notifyByWeb: true,
        },
      }),
    });
  });
}

export async function mockCourseEndpoints(page: Page) {
  await page.route('**/api/courses?**', (route) => {
    const url = route.request().url();
    if (url.includes('filter-options')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: filterOptions }) });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            courses: testCourses,
            pagination: { page: 1, limit: 100, total: testCourses.length, totalPages: 1 },
            stats: { total: testCourses.length, open: 3, closed: 2 },
          },
        }),
      });
    }
  });
}

export async function mockAllEndpoints(page: Page) {
  await mockAuthEndpoints(page);
  await mockCourseEndpoints(page);
  await page.route('**/api/config/faculties', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: filterOptions.faculties }) });
  });
  await page.route('**/api/config/majors', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, name: 'علوم الحاسوب', faculty: 'الهندسة' },
          { id: 2, name: 'الهندسة المدنية', faculty: 'الهندسة' },
          { id: 3, name: 'تقنية المعلومات', faculty: 'تقنية المعلومات' },
        ],
      }),
    });
  });
  await page.route('**/api/notifications?**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { notifications: [], unreadCount: 0 } }) });
  });
}
