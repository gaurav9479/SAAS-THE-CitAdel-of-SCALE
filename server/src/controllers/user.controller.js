import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";




const registerUser = asynchandler(async (req, res) => {
    const { name, email, phone, password, companyName, role } = req.body;

    if ([name, email, phone, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Name, email, phone, and password are required");
    }

    if (!companyName) {
        throw new ApiError(400, "Company name is required");
    }

    const company = await Company.findOne({ name: companyName });

    if (!company) {
        throw new ApiError(404, "Company not found with the provided name");
    }

    const existedUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
        companyId: company._id
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or phone already exists in this company");
    }

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role: role || "user",
        companyId: company._id,
        avatarUrl
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }



    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }
    const company = await Company.findById(user.companyId);

    if (!company) {
        throw new ApiError(404, "Company associated with this user not found");
    }

    if (company.subscription.status === "expired" || company.subscription.status === "suspended") {
        throw new ApiError(403, `Company subscription is ${company.subscription.status}. Please contact your administrator.`);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const plan = await SubscriptionPlan.findById(company.subscription.planId);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, {
            user: userResponse,
            company: {
                _id: company._id,
                name: company.name,
                logo: company.logo
            },
            plan: plan ? {
                name: plan.name,
                features: plan.features
            } : null,
            accessToken,
            refreshToken
        }, "Login successful")
    );
});



const getProfile = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const company = await Company.findById(user.companyId).select("name logo domain");

    return res.status(200).json(
        new ApiResponse(200, {
            user,
            company
        }, "Profile fetched successfully")
    );
});

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});
export {
    loginUser,
    logoutUser,
    registerUser,
    getProfile,
    refreshToken
};
