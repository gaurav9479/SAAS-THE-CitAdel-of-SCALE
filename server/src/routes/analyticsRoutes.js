import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSummary, getCategories, getHeatmap } from '../controllers/analyticsController.js';
import client from '../utils/redis.js';

const router = Router();

// Admin-only for summary and categories with caching
router.get('/summary', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        // Check cache first (2 minutes for analytics)
        const cached = await client.get('analytics:summary');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Call controller and cache result
        const result = await getSummary(req, res);
        if (result && typeof result === 'object') {
            await client.set('analytics:summary', JSON.stringify(result), { EX: 120 });
        }

        return result;
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch analytics summary' });
    }
});

router.get('/categories', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        // Check cache first (5 minutes for categories)
        const cached = await client.get('analytics:categories');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Call controller and cache result
        const result = await getCategories(req, res);
        if (result && typeof result === 'object') {
            await client.set('analytics:categories', JSON.stringify(result), { EX: 300 });
        }

        return result;
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch analytics categories' });
    }
});

// Heatmap for admin (can relax later)
router.get('/heatmap', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        // Check cache first (10 minutes for heatmap - less frequently changing)
        const cached = await client.get('analytics:heatmap');
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Call controller and cache result
        const result = await getHeatmap(req, res);
        if (result && typeof result === 'object') {
            await client.set('analytics:heatmap', JSON.stringify(result), { EX: 600 });
        }

        return result;
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch heatmap data' });
    }
});

export default router;


