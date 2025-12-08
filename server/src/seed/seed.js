import 'dotenv/config'
import mongoose from 'mongoose'
import Department from '../models/Department.js'
import User from '../models/User.js'

async function run() {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected')

    const departments = [
        // Roads & Infrastructure
        { name: 'Road Maintenance', code: 'ROAD_MAINT', categoriesHandled: ['Road Damage', 'Potholes'], slaPolicyHours: 48 },
        { name: 'Traffic Management', code: 'TRAFFIC', categoriesHandled: ['Traffic Signal Issue', 'Parking Issue'], slaPolicyHours: 24 },
        { name: 'Street Lighting', code: 'LIGHTING', categoriesHandled: ['Street Lights Not Working'], slaPolicyHours: 36 },
        { name: 'Sidewalk & Footpath', code: 'SIDEWALK', categoriesHandled: ['Road Damage', 'Encroachment'], slaPolicyHours: 48 },
        { name: 'Bridge Maintenance', code: 'BRIDGE', categoriesHandled: ['Road Damage'], slaPolicyHours: 72 },
        { name: 'Drainage & Stormwater', code: 'DRAINAGE', categoriesHandled: ['Drainage Blocked', 'Water Leakage'], slaPolicyHours: 24 },
        { name: 'Parking Management', code: 'PARKING', categoriesHandled: ['Parking Issue', 'Encroachment'], slaPolicyHours: 48 },
        { name: 'Signage & Road Markings', code: 'SIGNAGE', categoriesHandled: ['Road Damage'], slaPolicyHours: 48 },

        // Water & Sanitation
        { name: 'Water Supply', code: 'WATER_SUP', categoriesHandled: ['Water Leakage', 'No Water Supply'], slaPolicyHours: 12 },
        { name: 'Sewage Treatment', code: 'SEWAGE', categoriesHandled: ['Sewage Overflow'], slaPolicyHours: 24 },
        { name: 'Plumbing & Pipes', code: 'PLUMB', categoriesHandled: ['Water Leakage'], slaPolicyHours: 24 },
        { name: 'Water Quality', code: 'WATER_Q', categoriesHandled: ['Water Quality Issue'], slaPolicyHours: 6 },
        { name: 'Solid Waste Management', code: 'WASTE', categoriesHandled: ['Garbage Not Collected'], slaPolicyHours: 24 },
        { name: 'Recycling Services', code: 'RECYCLE', categoriesHandled: ['Garbage Not Collected'], slaPolicyHours: 48 },
        { name: 'Hazardous Waste', code: 'HAZ_WASTE', categoriesHandled: ['Illegal Dumping'], slaPolicyHours: 12 },
        { name: 'Street Cleaning', code: 'CLEAN', categoriesHandled: ['Garbage Not Collected'], slaPolicyHours: 24 },
        { name: 'Public Toilets', code: 'TOILETS', categoriesHandled: ['Public Toilet Issue'], slaPolicyHours: 12 },

        // Parks & Recreation
        { name: 'Parks & Gardens', code: 'PARKS', categoriesHandled: ['Park Maintenance'], slaPolicyHours: 48 },
        { name: 'Playgrounds', code: 'PLAY', categoriesHandled: ['Park Maintenance'], slaPolicyHours: 48 },
        { name: 'Sports Facilities', code: 'SPORTS', categoriesHandled: ['Park Maintenance'], slaPolicyHours: 72 },
        { name: 'Tree Maintenance', code: 'TREES', categoriesHandled: ['Tree Fallen'], slaPolicyHours: 48 },
        { name: 'Landscaping', code: 'LAND', categoriesHandled: ['Park Maintenance'], slaPolicyHours: 72 },

        // Public Safety
        { name: 'Fire Services', code: 'FIRE', categoriesHandled: ['Other'], slaPolicyHours: 1 },
        { name: 'Emergency Medical', code: 'EMS', categoriesHandled: ['Other'], slaPolicyHours: 1 },
        { name: 'Police Services', code: 'POLICE', categoriesHandled: ['Noise Pollution', 'Other'], slaPolicyHours: 2 },
        { name: 'Disaster Management', code: 'DISASTER', categoriesHandled: ['Other'], slaPolicyHours: 2 },
        { name: 'Animal Control', code: 'ANIMAL', categoriesHandled: ['Stray Animals'], slaPolicyHours: 12 },

        // Building & Planning
        { name: 'Building Permits', code: 'BUILD_PERM', categoriesHandled: ['Building Violation'], slaPolicyHours: 168 },
        { name: 'Zoning & Planning', code: 'ZONING', categoriesHandled: ['Illegal Construction', 'Encroachment'], slaPolicyHours: 168 },
        { name: 'Code Enforcement', code: 'CODE', categoriesHandled: ['Building Violation', 'Illegal Construction'], slaPolicyHours: 72 },
        { name: 'Construction Inspection', code: 'INSPECT', categoriesHandled: ['Building Violation'], slaPolicyHours: 48 },

        // Utilities & Energy
        { name: 'Electricity Distribution', code: 'ELECTRIC', categoriesHandled: ['Street Lights Not Working', 'Other'], slaPolicyHours: 12 },
        { name: 'Gas Services', code: 'GAS', categoriesHandled: ['Other'], slaPolicyHours: 6 },
        { name: 'Renewable Energy', code: 'RENEW', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Telecommunications', code: 'TELECOM', categoriesHandled: ['Other'], slaPolicyHours: 48 },

        // Community Services
        { name: 'Public Health', code: 'HEALTH', categoriesHandled: ['Air Pollution', 'Other'], slaPolicyHours: 24 },
        { name: 'Social Services', code: 'SOCIAL', categoriesHandled: ['Other'], slaPolicyHours: 48 },
        { name: 'Housing Authority', code: 'HOUSING', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Education Services', code: 'EDU', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Library Services', code: 'LIBRARY', categoriesHandled: ['Other'], slaPolicyHours: 48 },
        { name: 'Cultural Affairs', code: 'CULTURE', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Tourism & Events', code: 'TOURISM', categoriesHandled: ['Other'], slaPolicyHours: 72 },

        // Administrative
        { name: 'Customer Service', code: 'CUST_SVC', categoriesHandled: ['Other'], slaPolicyHours: 24 },
        { name: 'IT & Technology', code: 'IT', categoriesHandled: ['Other'], slaPolicyHours: 24 },
        { name: 'Finance & Revenue', code: 'FINANCE', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Human Resources', code: 'HR', categoriesHandled: ['Other'], slaPolicyHours: 72 },
        { name: 'Legal Services', code: 'LEGAL', categoriesHandled: ['Other'], slaPolicyHours: 168 },
    ]
    await Department.deleteMany({})
    const createdDepts = await Department.insertMany(departments)
    console.log('Departments seeded')

    const byCode = Object.fromEntries(createdDepts.map(d => [d.code, d]))

    await User.deleteMany({ role: { $in: ['staff'] } })
    const staff = [
        { name: 'Rohan Roads', email: 'rohan.roads@example.com', password: 'ChangeMe123!', role: 'staff', departmentId: byCode.ROAD_MAINT._id, staff: { title: 'Field Engineer', skills: ['paving'] } },
        { name: 'Wendy Water', email: 'wendy.water@example.com', password: 'ChangeMe123!', role: 'staff', departmentId: byCode.WATER_SUP._id, staff: { title: 'Plumber', skills: ['pipes', 'valves'] } },
        { name: 'Sanjay Sanitation', email: 'sanjay.san@example.com', password: 'ChangeMe123!', role: 'staff', departmentId: byCode.WASTE._id, staff: { title: 'Cleaner', skills: ['waste'] } },
    ]
    await User.insertMany(staff)
    console.log('Staff seeded')
    await mongoose.disconnect()
}

// run().catch(e => { console.error(e); process.exit(1) })


