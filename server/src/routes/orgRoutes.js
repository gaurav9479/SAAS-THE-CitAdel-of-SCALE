import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getOrganization, updatePlan } from '../controllers/orgController.js';

const router = Router();

router.get('/:id', requireAuth, getOrganization);
router.patch('/:id/plan', requireAuth, requireRole('admin'), updatePlan);

export default router;


