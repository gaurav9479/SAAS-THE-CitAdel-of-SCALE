import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    logo: {
        type: String
    },
    industry: {
        type: String
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },


    subscription: {
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan"
        },
        planSlug: {
            type: String,
            enum: ["free", "starter", "pro", "enterprise"],
            default: "free"
        },
        status: {
            type: String,
            enum: ["active", "trial", "expired", "suspended"],
            default: "trial"
        },
        trialEndsAt: { type: Date },
        currentPeriodEnd: { type: Date },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly"
        }
    },


    usage: {
        currentUsers: { type: Number, default: 0 },
        currentEngineers: { type: Number, default: 0 },
        issuesThisMonth: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


companySchema.index({ domain: 1 });
companySchema.index({ 'subscription.status': 1 });

const Company = mongoose.model("Company", companySchema);
export default Company;
