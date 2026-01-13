import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getNearbyStaff, assignStaffToComplaint } from '../controllers/staffController.js';

const router = Router();


router.get('/nearby', requireAuth, getNearbyStaff);


router.post('/assign', requireAuth, assignStaffToComplaint);

export default router;
