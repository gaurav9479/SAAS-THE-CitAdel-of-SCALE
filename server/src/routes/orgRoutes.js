import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getOrganization, updatePlan, checkCode, generateCode } from '../controllers/orgController.js';

const router = Router();

router.get('/:id', requireAuth, getOrganization);
router.patch('/:id/plan', requireAuth, requireRole('admin'), updatePlan);
router.get('/check/code', requireAuth, requireRole('admin'), checkCode);
router.get('/generate/code', requireAuth, requireRole('admin'), generateCode);

export default router;


