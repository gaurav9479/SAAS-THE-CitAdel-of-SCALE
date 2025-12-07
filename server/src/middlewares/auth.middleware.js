import { ApiError } from "../utility/ApiError.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Engineer from "../models/Engineer.model.js";
import Admin from "../models/admin.model.js";
import SuperOwner from "../models/superOwner.model.js";

export const verifyJWT = asynchandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


        let user = await User.findById(decodedToken?._id).select("-password -refreshtoken");
        let role = "user";

        if (!user) {
            user = await Engineer.findById(decodedToken?._id).select("-password -refreshtoken");
            role = "engineer";
        }

        if (!user) {
            user = await Admin.findById(decodedToken?._id).select("-password -refreshtoken");
            role = "admin";
        }

        if (!user) {
            user = await SuperOwner.findById(decodedToken?._id).select("-password -refreshtoken");
            role = "superowner";
        }

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        req.role = role;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
