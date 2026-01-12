import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSummary, getCategories, getHeatmap } from '../controllers/analyticsController.js';
import { get, set } from '../utils/redis.js';

const router = Router();

router.get('/summary', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const cached = await get('analytics:summary');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const result = await getSummary(req, res);
        if (result && typeof result === 'object') {
            await set('analytics:summary', JSON.stringify(result), { EX: 120 });
        }

        return res.json(result);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch analytics summary' });
    }
});

router.get('/categories', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const cached = await get('analytics:categories');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const result = await getCategories(req, res);
        if (result && typeof result === 'object') {
            await set('analytics:categories', JSON.stringify(result), { EX: 300 });
        }

        return res.json(result);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch analytics categories' });
    }
});

router.get('/heatmap', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const cached = await get('analytics:heatmap');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const result = await getHeatmap(req, res);
        if (result && typeof result === 'object') {
            await set('analytics:heatmap', JSON.stringify(result), { EX: 600 });
        }

        return res.json(result);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch heatmap data' });
    }
});

export default router;


