import Issue from "../models/issue.model.js";
import Engineer from "../models/Engineer.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import fs from "fs";
import { getImageKit } from "../config/imageKit.js";

const createIssue = asynchandler(async (req, res) => {
    const { title, description, priority, category, location, type } = req.body;

    if (!title || !category) {
        throw new ApiError(400, "Title and category are required");
    }

    let imageFileId = null;
    let imageUrl = null;

    if (req.file) {
        try {
            const uploadedResponse = await getImageKit().upload({
                file: fs.readFileSync(req.file.path),
                fileName: `issue-${Date.now()}`,
                folder: `/issues_company_${req.user.companyId}`
            });
            imageUrl = uploadedResponse.url;
            imageFileId = uploadedResponse.fileId;
            fs.unlinkSync(req.file.path);
        } catch (uploadError) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            throw new ApiError(500, "Failed to upload image: " + uploadError.message);
        }
    }

    const issue = await Issue.create({
        title,
        description,
        priority: priority || "Medium",
        category,
        location: location || {},
        attachment: imageUrl || null,
        type: type || 'OTHER',
        createdBy: req.user._id,
        companyId: req.user.companyId,
        status: "Open"
    });

    return res.status(201).json(
        new ApiResponse(201, issue, "Issue created successfully")
    );
});

const getAllIssues = asynchandler(async (req, res) => {
    const { status, priority, type, userId } = req.query;


    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    const issues = await Issue.find(filter)
        .populate('user', 'name email phone')
        .populate('Engineer', 'name email phone')
        .sort({ createdAt: -1 })
        .select('-__v');

    return res
        .status(200)
        .json(new ApiResponse(200, issues, "Issues retrieved successfully"));
});

const getIssueById = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const issue = await Issue.findById(issueId)
        .populate("assignedTo", "name email phone")
        .populate("createdBy", "name email phone department");

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }


    if (issue.companyId.toString() !== req.user.companyId.toString()) {
        throw new ApiError(403, "Access denied");
    }

    return res.status(200).json(
        new ApiResponse(200, issue, "Issue fetched successfully")
    );
});

const getUserIssues = asynchandler(async (req, res) => {
    const issues = await Issue.find({ createdBy: req.user._id })
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, issues, "User issues fetched successfully")
    );
});

const getEngineerIssues = asynchandler(async (req, res) => {
    const issues = await Issue.find({ assignedTo: req.user._id })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, issues, "Engineer filtered issues fetched successfully")
    );
});

const updateIssueStatus = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const { status, comment } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }


    const isAssignedEngineer = issue.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedEngineer && !isAdmin) {
        throw new ApiError(403, "Not authorized to update status");
    }

    issue.status = status;
    if (comment) {
        issue.history.push({
            status,
            comment,
            updatedBy: req.user._id,
            updatedByRole: req.user.role || 'engineer' // Fallback
        });
    }

    if (status === "Resolved" || status === "Closed") {
        issue.resolvedAt = new Date();
    }

    await issue.save();

    return res.status(200).json(
        new ApiResponse(200, issue, "Status updated successfully")
    );
});

const assignEngineer = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const { engineerId } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    const engineer = await Engineer.findById(engineerId);
    if (!engineer) {
        throw new ApiError(404, "Engineer not found");
    }


    if (engineer.companyId.toString() !== req.user.companyId.toString()) {
        throw new ApiError(400, "Engineer belongs to a different company");
    }

    issue.assignedTo = engineerId;
    issue.status = "Assigned";
    issue.history.push({
        status: "Assigned",
        comment: `Assigned to ${engineer.name}`,
        updatedBy: req.user._id,
        updatedByRole: 'admin'
    });

    await issue.save();


    await Engineer.findByIdAndUpdate(engineerId, { $inc: { currentAssignments: 1 } });

    return res.status(200).json(
        new ApiResponse(200, issue, "Engineer assigned successfully")
    );
});

const updateIssue = asynchandler(async (req, res) => {
    const { issueId } = req.params;
    const { title, description, priority } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }


    if (issue.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to update this issue");
    }

    if (title) issue.title = title;
    if (description) issue.description = description;
    if (priority) issue.priority = priority;
    if (req.body.location) issue.location = req.body.location;
    if (req.body.type) issue.type = req.body.type;
    // Attachment update is tricky without file upload in this route, skipping for now unless explicit.

    await issue.save();

    return res.status(200).json(
        new ApiResponse(200, issue, "Issue updated successfully")
    );
});

const deleteIssue = asynchandler(async (req, res) => {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }


    if (issue.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to delete this issue");
    }

    await Issue.findByIdAndDelete(issueId);

    return res.status(200).json(
        new ApiResponse(200, null, "Issue deleted successfully")
    );
});

export {
    createIssue,
    getAllIssues,
    getIssueById,
    getUserIssues,
    getEngineerIssues,
    updateIssueStatus,
    assignEngineer,
    updateIssue,
    deleteIssue
};
