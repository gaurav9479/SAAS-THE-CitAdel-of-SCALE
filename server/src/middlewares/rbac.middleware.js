import { ApiError } from "../utility/ApiError.js";

export const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.role || !allowedRoles.includes(req.role)) {
            throw new ApiError(403, "Access denied: You do not have permission to perform this action");
        }
        next();
    };
};
