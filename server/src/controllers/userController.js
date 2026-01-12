import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { getPlanLimits } from '../utils/plan.js';
import { get, set, del } from '../utils/redis.js';

export async function listUsers(req, res) {
    try {
        const { role, departmentId, status } = req.query;
        const filter = { organizationId: req.user.organizationId };
        if (role) filter.role = role;
        if (departmentId) filter.departmentId = departmentId;
        if (status) filter.status = status;
        const users = await User.find(filter)
            .select('_id name email role status departmentId staff ratings organizationId createdAt')
            .populate('departmentId', '_id name code');
        return res.json({ users });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to list users', details: e.message });
    }
}

export async function orgSummary(req, res) {
    try {
        const orgId = req.user.organizationId;
        const org = await Organization.findById(orgId);
        const limits = getPlanLimits(org?.plan || 'free');
        const [staffCount, citizenCount, pendingCount] = await Promise.all([
            User.countDocuments({ organizationId: orgId, role: 'staff', status: 'active' }),
            User.countDocuments({ organizationId: orgId, role: 'citizen', status: 'active' }),
            User.countDocuments({ organizationId: orgId, status: 'pending' }),
        ]);
        return res.json({ staffCount, citizenCount, pendingCount, maxStaff: limits.maxStaff || null, maxCitizens: limits.maxCitizens || null, plan: org?.plan || 'free' });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch org summary', details: e.message });
    }
}

export async function approveUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, organizationId: req.user.organizationId });
        if (!user) return res.status(404).json({ message: 'User not found' });


        const org = await Organization.findById(req.user.organizationId);
        const limits = getPlanLimits(org?.plan || 'free');
        if (user.role === 'staff' && limits.maxStaff) {
            const activeStaff = await User.countDocuments({ organizationId: org._id, role: 'staff', status: 'active' });
            if (activeStaff >= limits.maxStaff) {
                return res.status(400).json({ message: 'Seat limit reached for staff. Upgrade plan or free seats.' });
            }
        }
        if (user.role === 'citizen' && limits.maxCitizens) {
            const activeCitizens = await User.countDocuments({ organizationId: org._id, role: 'citizen', status: 'active' });
            if (activeCitizens >= limits.maxCitizens) {
                return res.status(400).json({ message: 'Seat limit reached for citizens. Upgrade plan or free seats.' });
            }
        }

        user.status = 'active';
        await user.save();
        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to approve user', details: e.message });
    }
}

export async function rejectUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, organizationId: req.user.organizationId, status: 'pending' });
        if (!user) return res.status(404).json({ message: 'User not found or not pending' });
        await user.deleteOne();
        return res.json({ message: 'User rejected and removed' });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to reject user', details: e.message });
    }
}

export async function getUserById(req, res) {
    try {
        const { id } = req.params;


        const cached = await get(`user:${id}`);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const user = await User.findById(id).select('-password').populate('departmentId', 'name code');
        if (!user) return res.status(404).json({ message: 'User not found' });

        await set(`user:${id}`, JSON.stringify({ user }), { EX: 900 });

        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch user' });
    }
}

export async function updateProfile(req, res) {
    try {
        const userId = req.user?.id;
        const { name, phone, workArea, isWorkingToday, contactPhone, contactEmail, skills, title, shiftStart, shiftEnd, address, defaultLocation } = req.body;

        console.log(`👤 Update Profile Request for User: ${userId}`);
        console.log('📦 Data received:', JSON.stringify(req.body, null, 2));

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData['profile.phone'] = phone;
        if (address) updateData['profile.address'] = address;
        if (defaultLocation) updateData['profile.defaultLocation'] = defaultLocation;
        if (workArea) updateData['staff.workArea'] = workArea;
        if (isWorkingToday !== undefined) updateData['staff.isWorkingToday'] = isWorkingToday;
        if (contactPhone) updateData['staff.contactPhone'] = contactPhone;
        if (contactEmail) updateData['staff.contactEmail'] = contactEmail;
        if (skills) updateData['staff.skills'] = skills;
        if (title) updateData['staff.title'] = title;
        if (shiftStart) updateData['staff.shiftStart'] = shiftStart;
        if (shiftEnd) updateData['staff.shiftEnd'] = shiftEnd;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select('-password')
            .populate('departmentId', 'name code');

        if (!user) {
            console.warn(`⚠️ User not found for update: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`✅ User profile updated successfully in DB: ${user._id}`);
        console.log(`📡 Database name: ${mongoose.connection.name}`);

        if (typeof del === 'function') {
            await del(`user:${userId}`).catch(e => console.error('Redis delete error:', e.message));
        }

        return res.json({ user, message: 'Profile updated successfully' });
    } catch (e) {
        console.error('❌ Failed to update profile:', e);
        return res.status(500).json({ message: 'Failed to update profile', details: e.message });
    }
}


