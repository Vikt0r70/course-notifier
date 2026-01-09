import { Router } from 'express';
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

export default router;
