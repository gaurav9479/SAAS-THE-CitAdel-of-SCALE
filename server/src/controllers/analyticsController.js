import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';

export async function getSummary(req, res) {
    try {

        const orgId = req.user.organizationId ? new mongoose.Types.ObjectId(req.user.organizationId) : null;
        if (!orgId) {
            return { total: 0, byStatus: {}, overdue: 0 };
        }

        const [total, byStatusAgg, overdue] = await Promise.all([
            Complaint.countDocuments({ organizationId: orgId }),
            Complaint.aggregate([
                { $match: { organizationId: orgId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Complaint.countDocuments({
                organizationId: orgId,
                slaDeadline: { $ne: null, $lt: new Date() },
                status: { $in: ['OPEN', 'IN_PROGRESS'] }
            }),
        ]);
        const byStatus = Object.fromEntries(byStatusAgg.map(s => [s._id, s.count]));
        return { total, byStatus, overdue };
    } catch (e) {
        throw e; 
    }
}

export async function getCategories(req, res) {
    try {

        const orgId = req.user.organizationId ? new mongoose.Types.ObjectId(req.user.organizationId) : null;
        if (!orgId) {
            return { categories: [] };
        }

        const data = await Complaint.aggregate([
            { $match: { organizationId: orgId } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        return { categories: data };
    } catch (e) {
        throw e; 
    }
}

export async function getHeatmap(req, res) {
    try {

        const orgId = req.user.organizationId ? new mongoose.Types.ObjectId(req.user.organizationId) : null;
        if (!orgId) {
            return { points: [] };
        }

        const points = await Complaint.aggregate([
            {
                $match: {
                    organizationId: orgId,
                    'location.lat': { $ne: null },
                    'location.lng': { $ne: null }
                }
            },
            { $project: { lat: '$location.lat', lng: '$location.lng' } },
        ]);
        return { points };
    } catch (e) {
        throw e; 
    }
}
