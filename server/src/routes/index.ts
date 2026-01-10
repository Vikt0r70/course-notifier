import { Router } from 'express';
import * as Sentry from '@sentry/node';
import authRoutes from './auth';
import courseRoutes from './courses';
import watchlistRoutes from './watchlist';
import notificationRoutes from './notifications';
import adminRoutes from './admin';
import reportRoutes from './reports';
import { FACULTIES, MAJORS_BY_FACULTY } from '../config/constants';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

router.get('/config/faculties', (req, res) => {
  res.json({ success: true, data: FACULTIES });
});

router.get('/config/majors', (req, res) => {
  res.json({ success: true, data: MAJORS_BY_FACULTY });
});

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Sentry test endpoint - triggers a test error to verify Sentry integration
router.get('/test-sentry', (req, res) => {
  const testId = `test-${Date.now()}`;
  
  // Add breadcrumb for context
  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Sentry test endpoint called',
    level: 'info',
    data: { testId }
  });

  // Capture a test message
  Sentry.captureMessage(`Sentry test message (ID: ${testId})`, 'info');

  // Throw a test error that Sentry will capture
  throw new Error(`Sentry test error (ID: ${testId}) - This is a test error to verify Sentry integration is working correctly.`);
});

// Alternative: Test Sentry without throwing (just sends a message)
router.get('/test-sentry-safe', (req, res) => {
  const testId = `test-${Date.now()}`;
  
  Sentry.captureMessage(`Sentry safe test (ID: ${testId})`, 'info');
  
  // Test Sentry Metrics (requires SDK 10.25.0+)
  Sentry.metrics.count('test.api_calls', 1);
  Sentry.metrics.gauge('test.random_value', Math.random() * 100);
  Sentry.metrics.distribution('test.response_time', Math.random() * 500, {
    unit: 'millisecond',
    attributes: { endpoint: 'test-sentry-safe' }
  });
  
  res.json({ 
    success: true, 
    message: 'Sentry test message and metrics sent',
    testId,
    note: 'Check your Sentry dashboard for the message and metrics'
  });
});

export default router;
