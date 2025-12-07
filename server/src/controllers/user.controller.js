import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";


const getCompanyFromDomain = async (req) => {
    const host = req.headers.host || req.hostname;
    const companyDomain = req.headers["x-company-domain"] || host.split(".")[0];

    if (!companyDomain || companyDomain === "www" || companyDomain === "localhost" || companyDomain === "api") {
        return null;
    }

    return await Company.findOne({ domain: companyDomain.toLowerCase(), isActive: true });
};



const loginUser = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    const company = await getCompanyFromDomain(req);
    if (!company) {
        throw new ApiError(404, "Company not found. Please access from your company's domain.");
    }

    const user = await User.findOne({
        email: email.toLowerCase(),
        companyId: company._id
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Please contact your administrator.");
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



const updateProfile = asynchandler(async (req, res) => {
    const { name, phone, avatarUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Profile updated successfully")
    );
});


const changePassword = asynchandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
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
    getProfile,
    updateProfile,
    changePassword,
    refreshToken
};
