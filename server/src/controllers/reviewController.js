import Review from '../models/Review.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

export async function submitReview(req, res) {
  try {
    const { complaintId, staffId, rating, comment, resolutionQuality, timeliness, communication } = req.body;
    const citizenId = req.user?.id;

    if (!complaintId || !staffId || !rating) {
      return res.status(400).json({ message: 'complaintId, staffId, and rating are required' });
    }

    // Verify complaint exists and is resolved
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.status !== 'RESOLVED') return res.status(400).json({ message: 'Can only review resolved complaints' });
    if (complaint.createdBy.toString() !== citizenId) return res.status(403).json({ message: 'Only complaint owner can review' });

    // Check if review already exists
    const existing = await Review.findOne({ complaintId });
    if (existing) return res.status(409).json({ message: 'Review already submitted for this complaint' });

    const review = await Review.create({
      complaintId,
      staffId,
      citizenId,
      rating,
      comment,
      resolutionQuality,
      timeliness,
      communication,
    });

    // Update staff average rating
    const allReviews = await Review.find({ staffId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(staffId, { 'ratings.average': avg, 'ratings.count': allReviews.length });

    return res.status(201).json({ review });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to submit review', details: e.message });
  }
}

export async function getStaffReviews(req, res) {
  try {
    const { staffId } = req.params;
    const { from, to } = req.query;

    let filter = { staffId };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const reviews = await Review.find(filter).populate('citizenId', 'name').populate('complaintId', 'title category').sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

