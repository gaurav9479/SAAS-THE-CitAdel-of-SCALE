import { Router } from 'express';
import Department from '../models/Department.js';
import { get, set } from '../utils/redis.js';

const router = Router();


router.get('/', async (_req, res) => {
    try {

        const cached = await get('departments:list');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }


        const items = await Department.find({}).select('_id name code categoriesHandled');


        await set('departments:list', JSON.stringify({ departments: items }), { EX: 3600 });

        return res.json({ departments: items });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

export default router;


