import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { signToken } from '../utils/jwt.js';
import { getPlanFeatures } from '../utils/plan.js';
import { generateOrgCode } from '../utils/orgCode.js';

export async function register(req, res) {
    try {
        const { name, email, password, role, phone, departmentId, staff, organizationId, organizationCode, organizationName } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        let org = null;

        // Admin can create or pick org via code; other roles must provide an org code
        if (role === 'admin') {
            if (organizationId) {
                org = await Organization.findById(organizationId);
                if (!org) return res.status(400).json({ message: 'Organization not found' });
            } else if (organizationCode) {
                const code = organizationCode.trim().toUpperCase();
                const exists = await Organization.findOne({ code });
                if (exists) return res.status(409).json({ message: 'Organization code already taken' });
                org = await Organization.create({ name: organizationName || `${name}'s Org`, plan: 'free', code });
            } else {
                // autogenerate unique code
                let code;
                do {
                    code = generateOrgCode(8);
                } while (await Organization.findOne({ code }));
                org = await Organization.create({ name: organizationName || `${name}'s Org`, plan: 'free', code });
            }
        } else {
            // non-admin: must provide code or existing org id; fallback to default individual org if configured
            if (organizationCode) {
                org = await Organization.findOne({ code: organizationCode.trim().toUpperCase() });
                if (!org) return res.status(400).json({ message: 'Invalid organization code' });
            } else if (organizationId) {
                org = await Organization.findById(organizationId);
                if (!org) return res.status(400).json({ message: 'Organization not found' });
            } else {
                // fallback: join default individual org (code: INDIVIDUAL) if it exists
                org = await Organization.findOne({ code: 'INDIVIDUAL' }) || await Organization.findOne();
                if (!org) return res.status(400).json({ message: 'Organization code required' });
            }
        }

        const payload = { name, email, password, role, organizationId: org._id };
        if (phone) payload.profile = { phone };
        if (departmentId) payload.departmentId = departmentId;
        if (staff) {
            // If registering staff, require workArea.location coordinates
            if (role === 'staff') {
                const hasCoords = staff?.workArea?.location?.lat !== undefined && staff?.workArea?.location?.lng !== undefined;
                if (!hasCoords) {
                    return res.status(400).json({ message: 'Staff registration requires working area coordinates (lat,lng)' });
                }
            }
            payload.staff = staff;
        }
        const user = await User.create(payload);
        const orgFeatures = getPlanFeatures(org.plan);
        const token = signToken({ id: user._id, role: user.role, name: user.name, organizationId: org._id, plan: org.plan });
        return res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: { id: org._id, name: org.name, plan: org.plan, features: orgFeatures } },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Registration failed', details: err.message });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const ok = await user.comparePassword(password);
        if (!ok) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const org = user.organizationId ? await Organization.findById(user.organizationId) : await Organization.findOne();
        const orgPlan = org?.plan || 'free';
        const orgFeatures = getPlanFeatures(orgPlan);
        const token = signToken({ id: user._id, role: user.role, name: user.name, organizationId: org?._id, plan: orgPlan });
        return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: org ? { id: org._id, name: org.name, plan: orgPlan, features: orgFeatures } : undefined } });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', details: err.message });
    }
}

export async function me(req, res) {
    try {
        // req.user is set by requireAuth
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const user = await User.findById(userId).select('_id name email role organizationId');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const org = user.organizationId ? await Organization.findById(user.organizationId) : await Organization.findOne();
        const orgPlan = org?.plan || 'free';
        const orgFeatures = getPlanFeatures(orgPlan);
        return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: org ? { id: org._id, name: org.name, plan: orgPlan, features: orgFeatures } : undefined } });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch current user', details: err.message });
    }
}


