import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ["Free", "Starter", "Pro", "Enterprise"]
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        default: ""
    },

    pricing: {
        monthly: { type: Number, default: 0 },
        yearly: { type: Number, default: 0 },
        currency: { type: String, default: "INR" }
    },

    limits: {
        maxUsers: { type: Number, default: 3 },
        maxEngineers: { type: Number, default: 1 },
        maxIssuesPerMonth: { type: Number, default: 50 }
    },

    features: {
        analytics: { type: Boolean, default: false },
        slaTracking: { type: Boolean, default: false }
    },

    displayOrder: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    badge: { type: String, default: "" },
    isActive: { type: Boolean, default: true }

}, { timestamps: true });



subscriptionPlanSchema.methods.hasFeature = function (featureName) {
    return this.features[featureName] === true;
};

subscriptionPlanSchema.methods.isWithinLimit = function (limitName, currentValue) {
    const limit = this.limits[limitName];
    if (limit === -1) return true;
    return currentValue < limit;
};

subscriptionPlanSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};



subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
export default SubscriptionPlan;
