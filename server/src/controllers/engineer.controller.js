import Engineer from "../models/Engineer.model.js";
import Issue from "../models/issue.model.js";
import Company from "../models/company.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";

const registerEngineer = asynchandler(async (req, res) => {
    const { name, email, password, phone, companyId, departmentId, specialization } = req.body;

    if ([name, email, password, phone, companyId, departmentId].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Name, email, password, phone, companyId and departmentId are required");
    }

    const company = await Company.findById(companyId);
    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    const existingEngineer = await Engineer.findOne({ email: email.toLowerCase() });
    if (existingEngineer) {
        throw new ApiError(409, "Engineer with this email already exists");
    }

    const engineer = await Engineer.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        companyId,
        departmentId,
        specialization
    });

    const createdEngineer = await Engineer.findById(engineer._id).select("-password -refreshToken");

    if (!createdEngineer) {
        throw new ApiError(500, "Something went wrong while registering the engineer");
    }

    return res.status(201).json(
        new ApiResponse(201, createdEngineer, "Engineer registered successfully")
    );
});

const loginEngineer = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const engineer = await Engineer.findOne({ email: email.toLowerCase() });

    if (!engineer) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!engineer.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Please contact your administrator.");
    }

    const isPasswordValid = await engineer.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = engineer.generateAccessToken();
    const refreshToken = engineer.generateRefreshToken();

    engineer.refreshToken = refreshToken;
    await engineer.save({ validateBeforeSave: false });

    const engineerResponse = engineer.toObject();
    delete engineerResponse.password;
    delete engineerResponse.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, {
            engineer: engineerResponse,
            accessToken,
            refreshToken
        }, "Login successful")
    );
});

const respondToIssue = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const { status, comment } = req.body;
    const engineerId = req.user._id;

    if (!issueId || !status) {
        throw new ApiError(400, "Issue ID and status are required");
    }

    const issue = await Issue.findById(issueId);

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    if (issue.assignedTo?.toString() !== engineerId.toString()) {
        throw new ApiError(403, "You are not authorized to respond to this issue");
    }

    const oldStatus = issue.status;
    issue.status = status;

    if (comment) {
        issue.history.push({
            status: status,
            comment: comment,
            updatedBy: engineerId,
            updatedByRole: "engineer"
        });
    }

    if (status === "Resolved" || status === "Closed") {
        issue.resolvedAt = new Date();
    }

    await issue.save();


    if ((oldStatus !== "Resolved" && oldStatus !== "Closed") && (status === "Resolved" || status === "Closed")) {
        await Engineer.findByIdAndUpdate(engineerId, { $inc: { currentAssignments: -1 } });
    } else if ((oldStatus === "Resolved" || oldStatus === "Closed") && (status !== "Resolved" && status !== "Closed")) {
        await Engineer.findByIdAndUpdate(engineerId, { $inc: { currentAssignments: 1 } });
    }

    return res.status(200).json(
        new ApiResponse(200, issue, "Issue status updated successfully")
    );
});
const logoutEngineer = asynchandler(async (req, res) => {
    await Engineer.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Engineer logged out successfully"));
});
const assignIssueToEngineer = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const { engineerId } = req.body;

    if (!engineerId) {
        throw new ApiError(400, "Engineer ID is required");
    }

    const engineer = await Engineer.findById(engineerId);
    if (!engineer) {
        throw new ApiError(404, "Engineer not found");
    }

    const issue = await Issue.findByIdAndUpdate(
        issueId,
        {
            Engineer: engineerId,
            status: "ASSIGNED"
        },
        { new: true }
    )
        .populate('user', 'name email phone')
        .populate('Engineer', 'name email phone');

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, issue, "Issue assigned to engineer successfully"));
});


export {
    registerEngineer,
    loginEngineer,
    respondToIssue,
    logoutEngineer,
    assignIssueToEngineer
};
