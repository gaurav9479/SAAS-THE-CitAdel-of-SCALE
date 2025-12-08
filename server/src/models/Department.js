import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        categoriesHandled: { type: [String], index: true, default: [] },
        slaPolicyHours: { type: Number, default: 72 },
        managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        contactEmail: { type: String },
        contactPhone: { type: String },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('Department', departmentSchema);


