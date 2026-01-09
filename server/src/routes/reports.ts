import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createReport, getReports, deleteReport } from '../controllers/reportController';

const router = express.Router();

// User routes
router.post('/', authenticate, createReport);

// Admin routes
router.get('/', authenticate, requireAdmin, getReports);
router.delete('/:id', authenticate, requireAdmin, deleteReport);

export default router;
