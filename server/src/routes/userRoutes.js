import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, getUserById, updateProfile, orgSummary, approveUser } from '../controllers/userController.js';
import client from '../utils/redis.js';

const router = Router();

// Admin and staff can list users; citizens cannot
router.get('/', requireAuth, requireRole('admin', 'staff'), listUsers);
router.get('/org/summary', requireAuth, requireRole('admin'), orgSummary);
router.patch('/:id/approve', requireAuth, requireRole('admin'), approveUser);
router.get('/:id', requireAuth, getUserById);
router.patch('/profile', requireAuth, updateProfile);

export default router;


