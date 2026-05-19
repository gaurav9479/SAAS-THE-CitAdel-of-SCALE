import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const adminUser = await User.findOne({ email: 'admin@demo.citadel' }).lean();
  console.log("Admin User:", JSON.stringify(adminUser, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
