import Issue from "../models/issue.model.js";
import Engineer from "../models/Engineer.model.js";
import { asynchandler } from "../utility/AsyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";

const createIssue = asynchandler(async (req, res) => {
    const { title, description, priority, category } = req.body;

    if (!title || !category) {
        throw new ApiError(400, "Title and category are required");
    }

    const issue = await Issue.create({
        title,
        description,
        priority: priority || "Medium",
        category,
        createdBy: req.user._id,
        companyId: req.user.companyId,
        status: "Open"
    });

    return res.status(201).json(
        new ApiResponse(201, issue, "Issue created successfully")
    );
});

const getAllIssues = asynchandler(async (req, res) => {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const query = { companyId: req.user.companyId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
        Issue.find(query)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Issue.countDocuments(query)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            issues,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "Issues fetched successfully")
    );
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
