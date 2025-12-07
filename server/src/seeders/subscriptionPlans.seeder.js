
import mongoose from "mongoose";
import dotenv from "dotenv";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";

dotenv.config();

const defaultPlans = [
    {
        name: "Free",
        slug: "free",
        description: "Get started with basic issue tracking. Perfect for small teams.",
        pricing: {
            monthly: 0,
            yearly: 0,
            currency: "INR"
        },
        limits: {
            maxUsers: 3,
            maxEngineers: 1,
            maxIssuesPerMonth: 50
        },
        features: {
            analytics: false,
            slaTracking: false
        },
        displayOrder: 1,
        isPopular: false,
        badge: "",
        isActive: true
    },
    {
        name: "Starter",
        slug: "starter",
        description: "For growing teams that need more capacity and analytics.",
        pricing: {
            monthly: 1499,
            yearly: 14999,
            currency: "INR"
        },
        limits: {
            maxUsers: 10,
            maxEngineers: 3,
            maxIssuesPerMonth: 200
        },
        features: {
            analytics: true,
            slaTracking: false
        },
        displayOrder: 2,
        isPopular: false,
        badge: "",
        isActive: true
    },
    {
        name: "Pro",
        slug: "pro",
        description: "For professional teams with unlimited issues and SLA tracking.",
        pricing: {
            monthly: 3999,
            yearly: 39999,
            currency: "INR"
        },
        limits: {
            maxUsers: 50,
            maxEngineers: 10,
            maxIssuesPerMonth: -1  // Unlimited
        },
        features: {
            analytics: true,
            slaTracking: true
        },
        displayOrder: 3,
        isPopular: true,
        badge: "Most Popular",
        isActive: true
    },
    {
        name: "Enterprise",
        slug: "enterprise",
        description: "For large organizations with unlimited everything.",
        pricing: {
            monthly: 9999,
            yearly: 99999,
            currency: "INR"
        },
        limits: {
            maxUsers: -1,  // Unlimited
            maxEngineers: -1,  // Unlimited
            maxIssuesPerMonth: -1  // Unlimited
        },
        features: {
            analytics: true,
            slaTracking: true
        },
        displayOrder: 4,
        isPopular: false,
        badge: "Best Value",
        isActive: true
    }
];


const seedPlans = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error("❌ MongoDB URI not found in environment variables");
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");


        for (const plan of defaultPlans) {
            await SubscriptionPlan.findOneAndUpdate(
                { slug: plan.slug },
                plan,
                { upsert: true, new: true }
            );
            console.log(`✅ Upserted plan: ${plan.name}`);
        }

        console.log("\n🎉 Successfully seeded all subscription plans!");


        const allPlans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
        console.log("\n📋 Current Plans:");
        console.log("─".repeat(90));
        console.log("  Plan         | Price/mo  | Users | Engineers | Issues/mo | Analytics | SLA");
        console.log("─".repeat(90));
        allPlans.forEach(plan => {
            const users = plan.limits.maxUsers === -1 ? "∞" : plan.limits.maxUsers;
            const engineers = plan.limits.maxEngineers === -1 ? "∞" : plan.limits.maxEngineers;
            const issues = plan.limits.maxIssuesPerMonth === -1 ? "∞" : plan.limits.maxIssuesPerMonth;
            console.log(
                `  ${plan.name.padEnd(12)} | ₹${String(plan.pricing.monthly).padStart(6)} | ${String(users).padStart(5)} | ${String(engineers).padStart(9)} | ${String(issues).padStart(9)} | ${plan.features.analytics ? "✅" : "❌"}         | ${plan.features.slaTracking ? "✅" : "❌"}`
            );
        });
        console.log("─".repeat(90));

    } catch (error) {
        console.error("❌ Error seeding plans:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n👋 Disconnected from MongoDB");
        process.exit(0);
    }
};

seedPlans();
