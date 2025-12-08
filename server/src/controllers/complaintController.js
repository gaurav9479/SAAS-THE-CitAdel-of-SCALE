import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';

function computeSlaDeadline(hours) {
    const now = new Date();
    const ms = (hours || 72) * 60 * 60 * 1000;
    return new Date(now.getTime() + ms);
}

export async function createComplaint(req, res) {
    try {
        const { title, description, category, priority, location, attachments, reporter, assignedDepartmentId, assignedStaffId } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ message: 'title, description and category are required' });
        }

        // Use user-selected department if provided, otherwise auto-find by category
        let deptId = assignedDepartmentId;
        let slaHours = 72;
        
        if (assignedDepartmentId) {
            const dept = await Department.findById(assignedDepartmentId).lean();
            if (dept) slaHours = dept.slaPolicyHours || 72;
        } else {
            const department = await Department.findOne({ categoriesHandled: category }).lean();
            deptId = department?._id;
            slaHours = department?.slaPolicyHours || 72;
        }

        const complaint = await Complaint.create({
            title,
            description,
            category,
            priority,
            location,
            attachments,
            createdBy: req.user?.id || null,
            reporterSnapshot: reporter, // {name, phone, email}
            assignedDepartmentId: deptId,
            assignedTo: assignedStaffId || null, // Will be set by location-based assignment
            slaDeadline: computeSlaDeadline(slaHours),
            statusHistory: [
                { from: null, to: 'OPEN', note: 'Complaint created', by: req.user?.id || null },
            ],
        });

        return res.status(201).json({ complaint });
    } catch (err) {
        console.error('createComplaint error', err);
        return res.status(500).json({ message: 'Failed to create complaint' });
    }
}

export async function getMyComplaints(req, res) {
    try {
        const list = await Complaint.find({ createdBy: req.user?.id }).sort({ createdAt: -1 }).limit(50);
        return res.json({ complaints: list });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch complaints' });
    }
}

export async function getComplaintsByStaff(req, res) {
    try {
        const { staffId } = req.params;
        const { status, from, to } = req.query;

        let filter = { assignedTo: staffId };
        if (status) filter.status = status;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const list = await Complaint.find(filter).sort({ createdAt: -1 }).limit(50);
        return res.json({ complaints: list });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch complaints' });
    }
}

export async function getAllComplaints(req, res) {
    try {
        const { status, departmentId, assignedTo, from, to, category, page = 1, limit = 20 } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (departmentId) filter.assignedDepartmentId = departmentId;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (category) filter.category = category;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [complaints, total] = await Promise.all([
            Complaint.find(filter)
                .populate('assignedTo', 'name email')
                .populate('assignedDepartmentId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Complaint.countDocuments(filter)
        ]);

        return res.json({
            complaints,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch complaints', details: err.message });
    }
}

export async function getComplaintDetail(req, res) {
    try {
        const c = await Complaint.findById(req.params.id).populate('assignedTo', 'name email').populate('assignedDepartmentId', 'name');
        if (!c) return res.status(404).json({ message: 'Not found' });
        return res.json({ complaint: c });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch complaint' });
    }
}

export async function updateComplaintStatus(req, res) {
    try {
        const { status, note, assignedTo } = req.body;
        const c = await Complaint.findById(req.params.id);
        if (!c) return res.status(404).json({ message: 'Not found' });
        const from = c.status;
        if (status) c.status = status;
        if (assignedTo) c.assignedTo = assignedTo;
        c.statusHistory.push({ from, to: c.status, note, by: req.user?.id });
        if (c.status === 'RESOLVED') c.resolutionTime = new Date();
        await c.save();
        return res.json({ complaint: c });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update complaint' });
    }
}


