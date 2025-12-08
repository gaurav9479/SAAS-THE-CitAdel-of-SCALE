import Organization from '../models/Organization.js';
import { getPlanFeatures } from '../utils/plan.js';

export async function getOrganization(req, res) {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        return res.json({ organization: { id: org._id, name: org.name, plan: org.plan, features: getPlanFeatures(org.plan) } });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch organization', details: e.message });
    }
}

export async function updatePlan(req, res) {
    try {
        const { plan } = req.body;
        if (!['free', 'god', 'titan'].includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan' });
        }
        const org = await Organization.findByIdAndUpdate(req.params.id, { plan }, { new: true });
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        return res.json({ organization: { id: org._id, name: org.name, plan: org.plan, features: getPlanFeatures(org.plan) } });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to update plan', details: e.message });
    }
}


