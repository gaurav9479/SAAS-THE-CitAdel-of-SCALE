import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';
import Department from './src/models/Department.js';
import Organization from './src/models/Organization.js';
import { getNearbyStaff } from './src/controllers/staffController.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const category = 'Road Damage';
  const lat = '24.097853965808646';
  const lng = '82.6582492945822';

  const departments = await Department.find({ categoriesHandled: category }).select('_id name').lean();
  console.log("Matching Departments for category 'Road Damage':", departments);

  const mockReq = {
    query: { lat, lng, category, radius: '15' },
    user: {
      email: 'employee@demo.citadel',
      organizationId: new mongoose.Types.ObjectId('6a0befeac90037764b606f94')
    }
  };

  const mockRes = {
    status(code) {
      console.log("Status Code:", code);
      return this;
    },
    json(data) {
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  await getNearbyStaff(mockReq, mockRes);

  await mongoose.disconnect();
}

main().catch(console.error);
