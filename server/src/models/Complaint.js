import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        type: { type: String },
    },
    { _id: false }
);

const statusEnum = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const priorityEnum = ['LOW', 'MEDIUM', 'HIGH'];

const complaintSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        priority: { type: String, enum: priorityEnum, default: 'LOW' },
        location: {
            lat: { type: Number },
            lng: { type: Number },
        },
        attachments: { type: [attachmentSchema], default: [] },
        status: { type: String, enum: statusEnum, default: 'OPEN' },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reporterSnapshot: {
            name: String,
            phone: String,
            email: String,
        },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

        assignedDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        slaDeadline: { type: Date },
        statusHistory: [
            {
                at: { type: Date, default: Date.now },
                by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                from: { type: String },
                to: { type: String },
                note: { type: String },
            },
        ],
        escalations: [
            {
                level: Number,
                at: Date,
                to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        resolutionTime: { type: Date },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedDepartmentId: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('Complaint', complaintSchema);


