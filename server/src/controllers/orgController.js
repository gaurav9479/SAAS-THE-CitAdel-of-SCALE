import Organization from '../models/Organization.js';
import { getPlanFeatures } from '../utils/plan.js';
import { generateOrgCode } from '../utils/orgCode.js';

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

export async function checkCode(req, res) {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ message: 'Code required' });
        const cleaned = code.trim().toUpperCase();
        if (cleaned.length < 4) return res.status(400).json({ message: 'Code must be at least 4 characters' });
        const existing = await Organization.findOne({ code: cleaned });
        return res.json({ available: !existing });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to check code', details: e.message });
    }
}

export async function getOrgByCodePublic(req, res) {
    try {
        const { code } = req.params;
        if (!code) return res.status(400).json({ message: 'Code required' });
        const org = await Organization.findOne({ code: code.trim().toUpperCase() }).select('_id name plan code');
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        return res.json({ organization: { id: org._id, name: org.name, plan: org.plan, code: org.code } });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch organization', details: e.message });
    }
}

export async function generateCode(req, res) {
    try {
        let code;
        do {
            code = generateOrgCode(8);
        } while (await Organization.findOne({ code }));
        return res.json({ code });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to generate code', details: e.message });
    }
}

export async function rotateOrgCode(req, res) {
    try {
        const orgId = req.params.id;
        const org = await Organization.findById(orgId);
        if (!org) return res.status(404).json({ message: 'Organization not found' });

        let code;
        do {
            code = generateOrgCode(8);
        } while (await Organization.findOne({ code }));

        org.code = code;
        await org.save();

        return res.json({ organization: { id: org._id, name: org.name, code: org.code, plan: org.plan } });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to rotate code', details: e.message });
    }
}


