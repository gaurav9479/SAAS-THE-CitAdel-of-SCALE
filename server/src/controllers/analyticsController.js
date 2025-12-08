import Complaint from '../models/Complaint.js';

export async function getSummary(req, res) {
    try {
        const [total, byStatusAgg, overdue] = await Promise.all([
            Complaint.countDocuments({}),
            Complaint.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Complaint.countDocuments({ slaDeadline: { $ne: null, $lt: new Date() }, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
        ]);
        const byStatus = Object.fromEntries(byStatusAgg.map(s => [s._id, s.count]));
        return { total, byStatus, overdue };
    } catch (e) {
        throw e; // Let the route handler catch this
    }
}

export async function getCategories(req, res) {
    try {
        const data = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        return { categories: data };
    } catch (e) {
        throw e; // Let the route handler catch this
    }
}

export async function getHeatmap(req, res) {
    try {
        const points = await Complaint.aggregate([
            { $match: { 'location.lat': { $ne: null }, 'location.lng': { $ne: null } } },
            { $project: { lat: '$location.lat', lng: '$location.lng' } },
        ]);
        return { points };
    } catch (e) {
        throw e; // Let the route handler catch this
    }
}


