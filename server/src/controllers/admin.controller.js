import Admin from "../models/admin.model.js";
import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import Engineer from "../models/Engineer.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";


const loginAdmin = asynchandler(async (req, res) => {
    const { email, password, company } = req.body;

    if (!email || !password ||!company) {
        throw new ApiError(400, "Email and password are required");
    }
    const admin = await Admin.findOne({
        email: email.toLowerCase(),
        companyId: company._id
    });

    if (!admin) {
        throw new ApiError(401, "Invalid credentials");
    }
    if (company.subscription.status === "expired" || company.subscription.status === "suspended") {
        throw new ApiError(403, `Company subscription is ${company.subscription.status}. Please contact support.`);
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const plan = await SubscriptionPlan.findById(company.subscription.planId);

    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, {
            admin: adminResponse,
            company: {
                _id: company._id,
                name: company.name,
                logo: company.logo,
                domain: company.domain,
                subscription: company.subscription
            },
            plan: plan ? {
                name: plan.name,
                limits: plan.limits,
                features: plan.features
            } : null,
            accessToken,
            refreshToken
        }, "Login successful")
    );
});



const getDashboardStats = asynchandler(async (req, res) => {
    const companyId = req.user.companyId;

    const [userCount, engineerCount, company] = await Promise.all([
        User.countDocuments({ companyId, isActive: true }),
        Engineer.countDocuments({ companyId, isActive: true }),
        Company.findById(companyId).populate('subscription.planId')
    ]);

    const plan = company?.subscription?.planId;

    return res.status(200).json(
        new ApiResponse(200, {
            users: {
                current: userCount,
                limit: plan?.limits?.maxUsers || 0
            },
            engineers: {
                current: engineerCount,
                limit: plan?.limits?.maxEngineers || 0
            },
            issues: {
                thisMonth: company?.usage?.issuesThisMonth || 0,
                limit: plan?.limits?.maxIssuesPerMonth || 0
            },
            subscription: company?.subscription,
            plan: plan ? {
                name: plan.name,
                features: plan.features
            } : null
        }, "Dashboard stats fetched successfully")
    );
});



// const addUser = asynchandler(async (req, res) => {
//     const { name, email, phone, password } = req.body;
//     const companyId = req.user.companyId;

//     if (!name || !email || !password) {
//         throw new ApiError(400, "Name, email, and password are required");
//     }
//     const company = await Company.findById(companyId);
//     const plan = await SubscriptionPlan.findById(company.subscription.planId);


//     const currentUserCount = await User.countDocuments({ companyId });
//     if (plan.limits.maxUsers !== -1 && currentUserCount >= plan.limits.maxUsers) {
//         throw new ApiError(403, `User limit reached (${plan.limits.maxUsers}). Please upgrade your plan.`);
//     }
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//         throw new ApiError(409, "User with this email already exists");
//     }

//     const user = await User.create({
//         companyId,
//         name,
//         email: email.toLowerCase(),
//         phone,
//         password
//     });


//     company.usage.currentUsers = currentUserCount + 1;
//     await company.save();

//     const userResponse = user.toObject();
//     delete userResponse.password;
//     delete userResponse.refreshToken;

//     return res.status(201).json(
//         new ApiResponse(201, userResponse, "User added successfully")
//     );
// });



// const addEngineer = asynchandler(async (req, res) => {
//     const { name, email, phone, password, departmentId, specialization } = req.body;
//     const companyId = req.user.companyId;

//     if (!name || !email || !password || !departmentId) {
//         throw new ApiError(400, "Name, email, password, and department are required");
//     }


//     const company = await Company.findById(companyId);
//     const plan = await SubscriptionPlan.findById(company.subscription.planId);


//     const currentEngineerCount = await Engineer.countDocuments({ companyId });
//     if (plan.limits.maxEngineers !== -1 && currentEngineerCount >= plan.limits.maxEngineers) {
//         throw new ApiError(403, `Engineer limit reached (${plan.limits.maxEngineers}). Please upgrade your plan.`);
//     }


//     const existingEngineer = await Engineer.findOne({ email: email.toLowerCase() });
//     if (existingEngineer) {
//         throw new ApiError(409, "Engineer with this email already exists");
//     }

//     const engineer = await Engineer.create({
//         companyId,
//         departmentId,
//         name,
//         email: email.toLowerCase(),
//         phone,
//         password,
//         specialization
//     });


//     company.usage.currentEngineers = currentEngineerCount + 1;
//     await company.save();

//     const engineerResponse = engineer.toObject();
//     delete engineerResponse.password;
//     delete engineerResponse.refreshToken;

//     return res.status(201).json(
//         new ApiResponse(201, engineerResponse, "Engineer added successfully")
//     );
// });



const getUsers = asynchandler(async (req, res) => {
    const users = await User.find({ companyId: req.user.companyId })
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
});



const getEngineers = asynchandler(async (req, res) => {
    const engineers = await Engineer.find({ companyId: req.user.companyId })
        .populate('departmentId', 'name')
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, engineers, "Engineers fetched successfully")
    );
});


const logoutAdmin = asynchandler(async (req, res) => {
    await Admin.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});



const getCompanyInfo = asynchandler(async (req, res) => {
    const company = await getCompanyFromDomain(req);

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            _id: company._id,
            name: company.name,
            logo: company.logo,
            isActive: company.isActive
        }, "Company info fetched successfully")
    );
});


export {
    loginAdmin,
    logoutAdmin,
    getDashboardStats,
    //addUser,
    getUsers,
    getEngineers,
    getCompanyInfo
};
