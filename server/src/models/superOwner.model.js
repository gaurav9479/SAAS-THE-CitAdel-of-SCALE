import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const superOwnerSchema = new mongoose.Schema({
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
        default: "superowner"
    },
    avatarUrl: {
        type: String
    },
    refreshToken: {
        type: String
    },
    permissions: {
        manageCompanies: { type: Boolean, default: true },
        manageSubscriptions: { type: Boolean, default: true },
        viewAnalytics: { type: Boolean, default: true },
        managePlans: { type: Boolean, default: true },
        managePayments: { type: Boolean, default: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });



superOwnerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const rounds = 10;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
});


superOwnerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


superOwnerSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d',
        }
    );
};


superOwnerSchema.methods.generateRefreshToken = function () {
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

const SuperOwner = mongoose.model("SuperOwner", superOwnerSchema);
export default SuperOwner;
