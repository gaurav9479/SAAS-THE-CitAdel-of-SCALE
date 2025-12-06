import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const engineerSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
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
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "engineer"
    },
    specialization: {
        type: String,
        trim: true
    },
    onCallStatus: {
        type: String,
        enum: ["available", "busy", "off-duty"],
        default: "available"
    },
    loadFactor: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    currentAssignments: {
        type: Number,
        default: 0
    },
    maxAssignments: {
        type: Number,
        default: 10
    },
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
    },
    avatarUrl: {
        type: String
    },
    refreshToken: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


engineerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const rounds = 10;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
});


engineerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


engineerSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            companyId: this.companyId,
            departmentId: this.departmentId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d',
        }
    );
};


engineerSchema.methods.generateRefreshToken = function () {
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

const Engineer = mongoose.model('Engineer', engineerSchema);
export default Engineer;
