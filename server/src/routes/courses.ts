import { Router } from 'express';
import * as courseController from '../controllers/courseController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, courseController.getCourses);
router.get('/stats', courseController.getStats);
router.get('/faculties', courseController.getFaculties);
router.get('/filter-options', courseController.getFilterOptions);
router.get('/:id', courseController.getCourseById);

export default router;
