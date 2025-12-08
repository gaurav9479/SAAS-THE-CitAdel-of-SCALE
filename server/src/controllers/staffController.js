import User from '../models/User.js';
import Department from '../models/Department.js';
import client from '../utils/redis.js';
import Complaint from '../models/Complaint.js';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

export async function getNearbyStaff(req, res) {
    try {
        const { lat, lng, category, radius = 10 } = req.query; // radius in km

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        // Create cache key based on request parameters
        const cacheKey = `staff:nearby:${lat}:${lng}:${category}:${radius}`;

        // Check cache first (5 minutes for staff availability)
        const cached = await client.get(cacheKey);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        // Find department that handles this category
        const department = await Department.findOne({ categoriesHandled: category }).lean();
        if (!department) {
            return res.status(404).json({ message: 'No department handles this category' });
        }

        // Get all staff from the relevant department who are working today
        const staff = await User.find({
            role: 'staff',
            departmentId: department._id,
            'staff.isWorkingToday': true,
            'staff.workArea.location.lat': { $exists: true },
            'staff.workArea.location.lng': { $exists: true }
        }).select('name email staff ratings departmentId').lean();

        // Calculate distances and filter by radius
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
                // Sort by rating (descending) then by distance (ascending)
                if (b.ratings.average !== a.ratings.average) {
                    return b.ratings.average - a.ratings.average;
                }
                return a.distance - b.distance;
            });

        const result = {
            staff: nearbyStaff,
            department: department.name,
            totalFound: nearbyStaff.length,
            searchRadius: parseFloat(radius)
        };

        // Cache for 5 minutes (300 seconds)
        await client.set(cacheKey, JSON.stringify(result), { EX: 300 });

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

        // Update complaint with assigned staff
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

        // Invalidate staff nearby cache for this staff member (since they're now assigned)
        // This ensures the next nearby search reflects the updated availability
        const keys = await client.keys('staff:nearby:*');
        for (const key of keys) {
            await client.del(key);
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
