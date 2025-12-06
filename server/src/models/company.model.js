import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        unique: true,
        sparse: true,
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
        ref: "User"
    },


    subscription: {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
        type: {
            type: String,
            enum: ["free", "starter", "pro", "enterprise"],
            default: "free"
        },
        status: {
            type: String,
            enum: ["active", "trial", "expired", "suspended", "cancelled"],
            default: "trial"
        },
        trialEndsAt: { type: Date },
        expiresAt: { type: Date },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly"
        }
    },


    


    features: {
        prioritySupport: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        customBranding: { type: Boolean, default: false },
        autoAssignment: { type: Boolean, default: false },
        slaTracking: { type: Boolean, default: false }
    },


    stats: {
        totalIssues: { type: Number, default: 0 },
        resolvedIssues: { type: Number, default: 0 },
        activeEngineers: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


companySchema.virtual('resolutionRate').get(function () {
    if (this.stats.totalIssues === 0) return 0;
    return ((this.stats.resolvedIssues / this.stats.totalIssues) * 100).toFixed(2);
});


companySchema.index({ name: 'text' });
companySchema.index({ 'subscription.status': 1 });

const Company = mongoose.model("Company", companySchema);
export default Company;
