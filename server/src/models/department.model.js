import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        enum: ['ELECTRICAL','PLUMBING','HVAC','CARPENTRY','CIVIL','PAINTING','CLEANING','LANDSCAPING','SECURITY','FIRE_SAFETY','ELEVATOR','GENERAL_MAINTENANCE','OTHER']
    },
    description: {
        type: String,
        trim: true
    },
    
    slaSettings: {
        lowPriorityHours: { type: Number, default: 72 },      
        mediumPriorityHours: { type: Number, default: 24 },   
        highPriorityHours: { type: Number, default: 8 },      
        criticalPriorityHours: { type: Number, default: 2 }   
    },

    stats: {
        totalEngineers: { type: Number, default: 0 },
        totalIssues: { type: Number, default: 0 },
        resolvedIssues: { type: Number, default: 0 },
        pendingIssues: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

const Department = mongoose.model("Department", departmentSchema);
export default Department;
