import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const adminSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "admin"
    },
    avatarUrl: {
        type: String
    },
    refreshToken: {
        type: String
    },
    permissions: {
        manageUsers: { type: Boolean, default: true },
        manageEngineers: { type: Boolean, default: true },
        manageIssues: { type: Boolean, default: true },
        viewReports: { type: Boolean, default: true },
        manageDepartments: { type: Boolean, default: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });


adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const rounds = 10;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            companyId: this.companyId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d',
        }
    );
};

adminSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

adminSchema.index({ companyId: 1, email: 1 });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
