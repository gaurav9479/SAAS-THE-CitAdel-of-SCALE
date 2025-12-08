import { Router } from 'express';
import Department from '../models/Department.js';
import client from '../utils/redis.js';

const router = Router();

// Public endpoint for registration and complaint forms
router.get('/', async (_req, res) => {
    try {
        // Check cache first
        const cached = await client.get('departments:list');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Fetch from DB otherwise
        const items = await Department.find({}).select('_id name code categoriesHandled');

        // Cache for 1 hour (3600 seconds)
        await client.set('departments:list', JSON.stringify({ departments: items }), { EX: 3600 });

        return res.json({ departments: items });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

export default router;


