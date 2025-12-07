import SuperOwner from "../models/superOwner.model.js";
import Company from "../models/company.model.js";
import Admin from "../models/admin.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";



const registerSuperOwner = asynchandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email, and password are required");
    }


    const existingOwner = await SuperOwner.findOne({});
    if (existingOwner) {
        throw new ApiError(403, "Super Owner already exists. Contact existing admin for access.");
    }

    const superOwner = await SuperOwner.create({
        name,
        email: email.toLowerCase(),
        phone,
        password
    });

    const accessToken = superOwner.generateAccessToken();
    const refreshToken = superOwner.generateRefreshToken();

    superOwner.refreshToken = refreshToken;
    superOwner.lastLogin = new Date();
    await superOwner.save({ validateBeforeSave: false });

    const ownerResponse = superOwner.toObject();
    delete ownerResponse.password;
    delete ownerResponse.refreshToken;

    return res.status(201).json(
        new ApiResponse(201, {
            superOwner: ownerResponse,
            accessToken,
            refreshToken
        }, "Super Owner registered successfully")
    );
});



const loginSuperOwner = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const superOwner = await SuperOwner.findOne({ email: email.toLowerCase() });
    if (!superOwner) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (!superOwner.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }

    const isPasswordValid = await superOwner.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = superOwner.generateAccessToken();
    const refreshToken = superOwner.generateRefreshToken();

    superOwner.refreshToken = refreshToken;
    superOwner.lastLogin = new Date();
    await superOwner.save({ validateBeforeSave: false });

    const ownerResponse = superOwner.toObject();
    delete ownerResponse.password;
    delete ownerResponse.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, {
            superOwner: ownerResponse,
            accessToken,
            refreshToken
        }, "Login successful")
    );
});



const createCompany = asynchandler(async (req, res) => {
    const {
        name,
        email,
        phone,
        address,
        domain,
        industry,
        adminName,
        adminEmail,
        adminPhone,
        adminPassword
    } = req.body;

    if (!name || !email || !address || !domain) {
        throw new ApiError(400, "Company name, email, address, and domain are required");
    }

    if (!adminName || !adminEmail || !adminPassword) {
        throw new ApiError(400, "Admin name, email, and password are required");
    }


    const existingCompany = await Company.findOne({
        $or: [{ email: email.toLowerCase() }, { domain: domain.toLowerCase() }]
    });
    if (existingCompany) {
        throw new ApiError(409, "Company with this email or domain already exists");
    }


    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email already exists");
    }


    const freePlan = await SubscriptionPlan.findOne({ slug: "free", isActive: true });
    if (!freePlan) {
        throw new ApiError(500, "Default subscription plan not found. Run the seeder first.");
    }


    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);


    const company = await Company.create({
        name,
        email: email.toLowerCase(),
        phone,
        address,
        domain: domain.toLowerCase(),
        industry,
        subscription: {
            planId: freePlan._id,
            planSlug: "free",
            status: "trial",
            trialEndsAt,
            currentPeriodEnd: trialEndsAt
        }
    });


    const admin = await Admin.create({
        companyId: company._id,
        name: adminName,
        email: adminEmail.toLowerCase(),
        phone: adminPhone,
        password: adminPassword
    });


    company.ownerId = admin._id;
    await company.save();

    return res.status(201).json(
        new ApiResponse(201, {
            company: {
                _id: company._id,
                name: company.name,
                email: company.email,
                domain: company.domain,
                subscription: company.subscription
            },
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            },
            plan: {
                name: freePlan.name,
                limits: freePlan.limits,
                trialEndsAt
            }
        }, "Company created successfully with admin account")
    );
});



const getAllCompanies = asynchandler(async (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { domain: { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        query['subscription.status'] = status;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
        Company.find(query)
            .populate('subscription.planId', 'name pricing')
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Company.countDocuments(query)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            companies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "Companies fetched successfully")
    );
});



const getCompanyDetails = asynchandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
        .populate('subscription.planId')
        .populate('ownerId', 'name email');

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const adminCount = await Admin.countDocuments({ companyId });

    return res.status(200).json(
        new ApiResponse(200, {
            company,
            adminCount
        }, "Company details fetched successfully")
    );
});



const updateCompanySubscription = asynchandler(async (req, res) => {
    const { companyId } = req.params;
    const { planSlug, status, billingCycle } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
        throw new ApiError(404, "Subscription plan not found");
    }

    // Calculate period end
    const periodEnd = new Date();
    if (billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    company.subscription = {
        planId: plan._id,
        planSlug: plan.slug,
        status: status || "active",
        currentPeriodEnd: periodEnd,
        billingCycle: billingCycle || "monthly"
    };
    await company.save();

    return res.status(200).json(
        new ApiResponse(200, {
            subscription: company.subscription,
            plan: {
                name: plan.name,
                limits: plan.limits,
                features: plan.features
            }
        }, "Subscription updated successfully")
    );
});

const getDashboardStats = asynchandler(async (req, res) => {
    const [
        totalCompanies,
        activeCompanies,
        trialCompanies,
        expiredCompanies
    ] = await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ 'subscription.status': 'active', isActive: true }),
        Company.countDocuments({ 'subscription.status': 'trial' }),
        Company.countDocuments({ 'subscription.status': 'expired' })
    ]);

    const plans = await SubscriptionPlan.find({ isActive: true });
    const planMap = {};
    plans.forEach(p => { planMap[p.slug] = p.pricing.monthly; });


    const activeSubCompanies = await Company.find({
        'subscription.status': 'active',
        'subscription.planSlug': { $ne: 'free' }
    });

    let monthlyRevenue = 0;
    activeSubCompanies.forEach(c => {
        const price = planMap[c.subscription.planSlug] || 0;
        if (c.subscription.billingCycle === 'yearly') {
            monthlyRevenue += price * 0.83; 
        } else {
            monthlyRevenue += price;
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            companies: {
                total: totalCompanies,
                active: activeCompanies,
                trial: trialCompanies,
                expired: expiredCompanies
            },
            revenue: {
                monthlyRecurring: Math.round(monthlyRevenue),
                currency: "INR"
            }
        }, "Dashboard stats fetched successfully")
    );
});


const logoutSuperOwner = asynchandler(async (req, res) => {
    await SuperOwner.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});


export {
    registerSuperOwner,
    loginSuperOwner,
    logoutSuperOwner,
    createCompany,
    getAllCompanies,
    getCompanyDetails,
    updateCompanySubscription,
    getDashboardStats
};
