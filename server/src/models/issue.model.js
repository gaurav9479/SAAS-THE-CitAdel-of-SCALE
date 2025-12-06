const TaskSchema = new mongoose.Schema({
    companyId: mongoose.ObjectId,
    title: String,
    category: String,
    priority: { type: String, enum: ["Low", "Medium", "High"] },
    assignedTo: mongoose.ObjectId,
    status: { type: String, default: "Open" },
    history: [
        {
            status: String,
            timestamp: Date,
            comment: String,
            updatedBy: mongoose.ObjectId
        }
    ]
});
