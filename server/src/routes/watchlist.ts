import { Router } from 'express';
import * as watchlistController from '../controllers/watchlistController';
import { authenticate } from '../middleware/auth';
import { validate, watchlistSchema } from '../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', watchlistController.getWatchlist);
router.post('/', validate(watchlistSchema), watchlistController.addToWatchlist);
router.put('/:id', watchlistController.updateWatchlistSettings);
router.delete('/:id', watchlistController.removeFromWatchlist);
router.get('/check', watchlistController.checkWatching);
router.get('/:id/similar-patterns', watchlistController.getSimilarCoursePatterns);

export default router;
