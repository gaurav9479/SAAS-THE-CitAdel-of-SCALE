import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';
import Department from './src/models/Department.js';
import Organization from './src/models/Organization.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const demoOrg = await Organization.findOne({ code: 'DEMO123' });
  console.log("Demo Org:", demoOrg);

  if (demoOrg) {
    const staffCount = await User.countDocuments({ organizationId: demoOrg._id, role: 'staff' });
    console.log("Demo Org Staff Count:", staffCount);

    const staffSample = await User.find({ organizationId: demoOrg._id, role: 'staff' }).limit(3).lean();
    console.log("Demo Org Staff Sample:", JSON.stringify(staffSample, null, 2));
  }

  const allDepts = await Department.find().lean();
  console.log("Total Departments:", allDepts.length);
  console.log("First Department Categories:", allDepts[0]?.categoriesHandled);

  await mongoose.disconnect();
}

main().catch(console.error);
