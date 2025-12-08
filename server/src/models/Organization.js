import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        plan: { type: String, enum: ['free', 'god', 'titan'], default: 'free' },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('Organization', organizationSchema);


