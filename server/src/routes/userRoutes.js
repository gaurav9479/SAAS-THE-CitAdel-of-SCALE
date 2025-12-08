import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, getUserById, updateProfile } from '../controllers/userController.js';
import client from '../utils/redis.js';

const router = Router();

// Admin and staff can list users; citizens cannot
router.get('/', requireAuth, requireRole('admin', 'staff'), listUsers);
router.get('/:id', requireAuth, getUserById);
router.patch('/profile', requireAuth, updateProfile);

export default router;


