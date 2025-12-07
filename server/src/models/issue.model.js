import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium"
    },
    status: {
        type: String,
        enum: ["Open", "Assigned", "In Progress", "Resolved", "Closed"],
        default: "Open"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Engineer"
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    },

    sla: {
        dueDate: { type: Date },
        breached: { type: Boolean, default: false }
    },
    resolvedAt: {
        type: Date
    },
    history: [{
        status: { type: String },
        comment: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId },
        updatedByRole: { type: String, enum: ["user", "admin", "engineer"] },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });


issueSchema.index({ companyId: 1, status: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdBy: 1 });

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
