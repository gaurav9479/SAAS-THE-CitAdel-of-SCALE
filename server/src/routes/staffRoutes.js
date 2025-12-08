import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getNearbyStaff, assignStaffToComplaint } from '../controllers/staffController.js';
import client from '../utils/redis.js';

const router = Router();

// Get nearby staff for a location and category
router.get('/nearby', requireAuth, getNearbyStaff);

// Assign staff to complaint
router.post('/assign', requireAuth, assignStaffToComplaint);

export default router;
