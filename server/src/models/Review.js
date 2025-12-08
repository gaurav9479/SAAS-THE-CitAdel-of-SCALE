import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    resolutionQuality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

reviewSchema.index({ staffId: 1 });
reviewSchema.index({ complaintId: 1 }, { unique: true }); // one review per complaint

export default mongoose.model('Review', reviewSchema);

