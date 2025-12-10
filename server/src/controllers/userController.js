import User from '../models/User.js';
import client from '../utils/redis.js';

export async function listUsers(req, res) {
    try {
        const { role, departmentId, status } = req.query;
        const filter = { organizationId: req.user.organizationId };
        if (role) filter.role = role;
        if (departmentId) filter.departmentId = departmentId;
        if (status) filter.status = status;
        const users = await User.find(filter).select('_id name email role status departmentId staff ratings organizationId createdAt');
        return res.json({ users });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to list users', details: e.message });
    }
}

export async function orgSummary(req, res) {
    try {
        const orgId = req.user.organizationId;
        const [staffCount, citizenCount, pendingCount] = await Promise.all([
            User.countDocuments({ organizationId: orgId, role: 'staff', status: 'active' }),
            User.countDocuments({ organizationId: orgId, role: 'citizen', status: 'active' }),
            User.countDocuments({ organizationId: orgId, status: 'pending' }),
        ]);
        return res.json({ staffCount, citizenCount, pendingCount });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch org summary', details: e.message });
    }
}

export async function approveUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, organizationId: req.user.organizationId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.status = 'active';
        await user.save();
        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to approve user', details: e.message });
    }
}

export async function getUserById(req, res) {
    try {
        const { id } = req.params;

        // Check cache first
        const cached = await client.get(`user:${id}`);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Fetch from DB otherwise
        const user = await User.findById(id).select('-password').populate('departmentId', 'name code');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Cache for 15 minutes (900 seconds)
        await client.set(`user:${id}`, JSON.stringify({ user }), { EX: 900 });

        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch user' });
    }
}

export async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { name, phone, workArea, isWorkingToday, contactPhone, contactEmail, skills, title, shiftStart, shiftEnd } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData['profile.phone'] = phone;
        if (workArea) updateData['staff.workArea'] = workArea;
        if (isWorkingToday !== undefined) updateData['staff.isWorkingToday'] = isWorkingToday;
        if (contactPhone) updateData['staff.contactPhone'] = contactPhone;
        if (contactEmail) updateData['staff.contactEmail'] = contactEmail;
        if (skills) updateData['staff.skills'] = skills;
        if (title) updateData['staff.title'] = title;
        if (shiftStart) updateData['staff.shiftStart'] = shiftStart;
        if (shiftEnd) updateData['staff.shiftEnd'] = shiftEnd;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password').populate('departmentId', 'name code');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Invalidate cache for this user
        await client.del(`user:${userId}`);

        return res.json({ user, message: 'Profile updated successfully' });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to update profile', details: e.message });
    }
}


