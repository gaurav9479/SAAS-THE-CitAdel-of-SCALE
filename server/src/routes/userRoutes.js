import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, getUserById, updateProfile, orgSummary, approveUser, rejectUser } from '../controllers/userController.js';

const router = Router();


router.get('/', requireAuth, requireRole('admin', 'staff'), listUsers);
router.get('/org/summary', requireAuth, requireRole('admin'), orgSummary);
router.patch('/:id/approve', requireAuth, requireRole('admin'), approveUser);
router.delete('/:id/reject', requireAuth, requireRole('admin'), rejectUser);
router.get('/:id', requireAuth, getUserById);
router.patch('/profile', requireAuth, updateProfile);

export default router;


