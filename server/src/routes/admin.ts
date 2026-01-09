import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/verify', adminController.toggleEmailVerification);
router.get('/watchlists', adminController.getAllWatchlists);
router.post('/scraper/run', adminController.runScraper);
router.get('/scraper/logs', adminController.getScraperLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.post('/email/test', adminController.sendTestEmail);
router.post('/notifications/check', adminController.triggerNotificationCheck);

// SMTP Settings
router.get('/smtp', adminController.getSmtpSettings);
router.put('/smtp', adminController.updateSmtpSettings);

// Server Logs
router.get('/logs/server', adminController.getServerLogs);
router.delete('/logs/server', adminController.clearServerLogs);

// Database Logs/Stats
router.get('/logs/database', adminController.getDatabaseLogs);

// Scraper Status (real-time)
router.get('/scraper/status', adminController.getScraperStatus);

// Watch All Courses (Admin feature)
router.get('/watch-all-status', adminController.getWatchAllCoursesStatus);
router.post('/toggle-watch-all', adminController.toggleWatchAllCourses);

export default router;
