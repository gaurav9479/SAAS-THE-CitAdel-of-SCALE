import Company from "../models/company.model.js";
import Admin from "../models/admin.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";


const registerCompany = asynchandler(async (req, res) => {
    const { name, email, phone, address, industry, domain } = req.body;


    if (!name || !email || !address) {
        throw new ApiError(400, "fill all credentials");
    }


    const existingCompany = await Company.findOne({
        $or: [{ email }, { domain: domain || null }]
    });

    if (existingCompany) {
        throw new ApiError(409, "Company with this email or domain already exists");
    }


    const company = await Company.create({
        name,
        email,
        phone,
        address,
        industry,
        domain,
        ownerId: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, company, "Company registered successfully")
    );
});

const getCompanyById = asynchandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).populate('ownerId', 'name email');

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, company, "Company fetched successfully")
    );
});


// const updateCompany = asynchandler(async (req, res) => {
//     const { companyId } = req.params;
//     const updateData = req.body;


//     delete updateData.ownerId;
//     delete updateData.stats;

//     const company = await Company.findByIdAndUpdate(
//         companyId,
//         { $set: updateData },
//         { new: true, runValidators: true }
//     );

//     if (!company) {
//         throw new ApiError(404, "Company not found");
//     }

//     return res.status(200).json(
//         new ApiResponse(200, company, "Company updated successfully")
//     );
// });


const getAllCompanies = asynchandler(async (req, res) => {
    const { search, status } = req.query;
    const query = {};


    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }


    if (status) {
        query['subscription.status'] = status;
    }


    const companies = await Company.find(query).select('-__v').sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, companies, "Companies fetched successfully")
    );
});



// const deleteCompany = asynchandler(async (req, res) => {
//     const { companyId } = req.params;

//     const company = await Company.findByIdAndDelete(companyId);

//     if (!company) {
//         throw new ApiError(404, "Company not found");
//     }

//     return res.status(200).json(
//         new ApiResponse(200, null, "Company deleted successfully")
//     );
// });


const getCompanyStats = asynchandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).select('name stats subscription');

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            name: company.name,
            stats: company.stats,
            subscription: company.subscription,
            resolutionRate: company.resolutionRate
        }, "Company stats fetched successfully")
    );
});


const updateSubscription = asynchandler(async (req, res) => {
    const { companyId } = req.params;
    const { type, status, expiresAt } = req.body;

    const company = await Company.findByIdAndUpdate(
        companyId,
        {
            $set: {
                'subscription.type': type,
                'subscription.status': status,
                'subscription.expiresAt': expiresAt
            }
        },
        { new: true }
    );

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, company.subscription, "Subscription updated successfully")
    );
});

const registerAdmin = asynchandler(async (req, res) => {
    const { name, email, password, phone, companyId } = req.body;

    if ([name, email, password, companyId].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Name, email, password, and companyId are required");
    }

    const company = await Company.findById(companyId);
    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email already exists");
    }

    const admin = await Admin.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        companyId
    });

    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

    if (!createdAdmin) {
        throw new ApiError(500, "Something went wrong while registering the admin");
    }

    return res.status(201).json(
        new ApiResponse(201, createdAdmin, "Admin registered successfully")
    );
});

export {
    registerAdmin,
    registerCompany,
    getAllCompanies,
    getCompanyById,
    // updateCompany,
    // deleteCompany,
    getCompanyStats,
    updateSubscription,

};
