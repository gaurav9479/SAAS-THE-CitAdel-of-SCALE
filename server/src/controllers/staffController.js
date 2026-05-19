import User from '../models/User.js';
import Department from '../models/Department.js';
import { get, set, del, keys } from '../utils/redis.js';
import Complaint from '../models/Complaint.js';


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

export async function getNearbyStaff(req, res) {
    try {
        const { lat, lng, category, radius = 10 } = req.query; // radius in km

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const cacheKey = `staff:nearby:${lat}:${lng}:${category}:${radius}`;


        const cached = await get(cacheKey);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }


        const departments = await Department.find({ categoriesHandled: category }).select('_id name').lean();
        if (!departments || departments.length === 0) {
            return res.status(404).json({ message: 'No department handles this category' });
        }

        const deptIds = departments.map(d => d._id);


        let staff;
        const isDemo = req.user?.email?.endsWith('@demo.citadel');

        if (isDemo) {
            staff = await User.find({
                role: 'staff',
                organizationId: req.user.organizationId,
                departmentId: { $in: deptIds }
            }).select('name email staff ratings departmentId').lean();

            staff = staff.map((member, i) => {
                const projectedLat = parseFloat(lat) + (0.002 * (i + 1));
                const projectedLng = parseFloat(lng) + (0.002 * (i + 1));
                return {
                    ...member,
                    staff: {
                        ...member.staff,
                        isWorkingToday: true,
                        workArea: {
                            ...member.staff?.workArea,
                            city: 'Demo City',
                            location: { lat: projectedLat, lng: projectedLng }
                        }
                    }
                };
            });
        } else {
            staff = await User.find({
                role: 'staff',
                organizationId: req.user.organizationId,
                departmentId: { $in: deptIds },
                'staff.isWorkingToday': true,
                'staff.workArea.location.lat': { $exists: true },
                'staff.workArea.location.lng': { $exists: true }
            }).select('name email staff ratings departmentId').lean();
        }


        const nearbyStaff = staff
            .map(staffMember => {
                const distance = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    staffMember.staff.workArea.location.lat,
                    staffMember.staff.workArea.location.lng
                );
                return {
                    ...staffMember,
                    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                    estimatedArrival: Math.round(distance * 2) // Rough estimate: 2 minutes per km
                };
            })
            .filter(staffMember => staffMember.distance <= parseFloat(radius))
            .sort((a, b) => {

                if (b.ratings.average !== a.ratings.average) {
                    return b.ratings.average - a.ratings.average;
                }
                return a.distance - b.distance;
            });

        const result = {
            staff: nearbyStaff,
            departments: departments.map(d => d.name),
            totalFound: nearbyStaff.length,
            searchRadius: parseFloat(radius)
        };


        await set(cacheKey, JSON.stringify(result), { EX: 300 });

        return res.json(result);
    } catch (err) {
        console.error('getNearbyStaff error', err);
        return res.status(500).json({ message: 'Failed to find nearby staff', details: err.message });
    }
}

export async function assignStaffToComplaint(req, res) {
    try {
        const { complaintId, staffId } = req.body;

        if (!complaintId || !staffId) {
            return res.status(400).json({ message: 'complaintId and staffId are required' });
        }


        const complaint = await Complaint.findByIdAndUpdate(
            complaintId,
            {
                assignedTo: staffId,
                $push: {
                    statusHistory: {
                        from: 'OPEN',
                        to: 'ASSIGNED',
                        note: 'Staff assigned to complaint',
                        by: req.user?.id,
                        at: new Date()
                    }
                }
            },
            { new: true }
        ).populate('assignedTo', 'name email staff.contactPhone staff.contactEmail');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        try {
            const cacheKeys = await keys('staff:nearby:*');
            for (const key of cacheKeys) {
                await del(key);
            }
        } catch (err) {

            console.warn('Cache invalidation skipped:', err.message);
        }

        return res.json({
            complaint,
            message: 'Staff assigned successfully',
            assignedStaff: complaint.assignedTo
        });
    } catch (err) {
        console.error('assignStaffToComplaint error', err);
        return res.status(500).json({ message: 'Failed to assign staff', details: err.message });
    }
}
