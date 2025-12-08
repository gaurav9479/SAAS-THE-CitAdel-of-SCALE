import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['citizen', 'staff', 'admin'], default: 'citizen' },
        departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        staff: {
            title: { type: String },
            skills: { type: [String], default: [] },
            shiftStart: { type: String }, // e.g., '09:00'
            shiftEnd: { type: String },   // e.g., '18:00'
            isWorkingToday: { type: Boolean, default: true },
            workArea: {
                city: { type: String },
                zones: { type: [String], default: [] }, // e.g., ['Zone A', 'North District']
                location: { lat: Number, lng: Number },
            },
            contactPhone: { type: String },
            contactEmail: { type: String },
        },
        ratings: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        profile: {
            avatarUrl: { type: String },
            phone: { type: String },
            address: {
                line1: { type: String },
                line2: { type: String },
                city: { type: String },
                state: { type: String },
                zip: { type: String },
            },
            bio: { type: String },
        },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

UserSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) return next();
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;


