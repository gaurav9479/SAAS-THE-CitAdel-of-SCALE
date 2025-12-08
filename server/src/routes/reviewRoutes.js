import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { submitReview, getStaffReviews } from '../controllers/reviewController.js';

const router = Router();

router.post('/', requireAuth, requireRole('citizen'), submitReview);
router.get('/staff/:staffId', requireAuth, getStaffReviews);

export default router;

