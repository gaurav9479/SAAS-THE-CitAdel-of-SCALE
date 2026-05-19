import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import { signToken } from '../utils/jwt.js';

const DEMO_ORG_CODE = 'DEMO123';

export async function loginDemoUser(req, res) {
  return res.status(200).json({ message: 'Demo controller bootstrap active' });
}

export async function exitDemo(req, res) {
  return res.json({ success: true, message: 'Demo exit bootstrap active' });
}

export async function getDemoDepartments(req, res) {
  try {
    const departments = await Department.find().select('_id name');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments', details: err.message });
  }
}
