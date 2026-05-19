import { Router } from 'express';
import { loginDemoUser, exitDemo, getDemoDepartments } from '../controllers/demoController.js';

const router = Router();

// /api/demo/exit
router.post('/exit', exitDemo);

// /api/demo/departments
router.get('/departments', getDemoDepartments);

// /api/demo/:role
router.post('/:role', loginDemoUser);

export default router;
