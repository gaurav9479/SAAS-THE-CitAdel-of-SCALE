import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createComplaint, getMyComplaints, getComplaintsByStaff, getAllComplaints, getComplaintDetail, updateComplaintStatus } from '../controllers/complaintController.js';

const router = Router();


router.get('/', requireAuth, (req, res, next) => {
    if (req.user.role === 'citizen') {
        return getMyComplaints(req, res);
    } else {
        return getAllComplaints(req, res);
    }
});
router.get('/mine', requireAuth,requireRole('citizen'), getMyComplaints);
router.get('/staff/:staffId', requireAuth, getComplaintsByStaff);
router.get('/:id', requireAuth, getComplaintDetail);
router.patch('/:id/status', requireAuth, requireRole('staff', 'admin'), updateComplaintStatus);


router.post('/', requireAuth, createComplaint);

export default router;


