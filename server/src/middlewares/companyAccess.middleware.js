import { ApiError } from "../utility/ApiError.js";

export const verifyCompanyAccess = (req, res, next) => {
    // Super Owner bypass
    if (req.role === 'super-owner') {
        return next();
    }

    const { companyId } = req.params;


    if (!companyId) {
        return next();
    }

    if (!req.user.companyId || req.user.companyId.toString() !== companyId) {
        throw new ApiError(403, "Access denied: You cannot access data from another company");
    }

    next();
};
