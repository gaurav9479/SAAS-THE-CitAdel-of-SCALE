import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import { signToken } from '../utils/jwt.js';

const DEMO_ORG_CODE = 'DEMO123';

async function setupDemoEnvironment() {
  let org = await Organization.findOne({ code: DEMO_ORG_CODE });
  if (!org) {
    org = await Organization.create({
      name: 'Demo Corporation',
      code: DEMO_ORG_CODE,
      plan: 'titan'
    });
  }

  const departments = await Department.find();

  // Ensure Admin and Citizen exist
  for (const du of [
    { role: 'admin', email: 'admin@demo.citadel', name: 'Demo Admin' },
    { role: 'citizen', email: 'employee@demo.citadel', name: 'Demo Employee' },
    { role: 'citizen', email: 'resident@demo.citadel', name: 'Local Resident' }
  ]) {
    const existing = await User.findOne({ email: du.email });
    if (!existing) {
      await User.create({
        name: du.name, email: du.email, password: 'Password@123', role: du.role,
        organizationId: org._id, emailVerified: true, status: 'active',
        profile: { phone: '+919999999999', bio: 'This is a demo account.' }
      });
    }
  }

  // Seed Staff for EVERY Department
  const existingStaffCount = await User.countDocuments({ organizationId: org._id, role: 'staff' });
  if (existingStaffCount === 0) {
    const staffToInsert = [];
    
    staffToInsert.push({
      name: 'Demo Staff', email: 'staff@demo.citadel', password: 'Password@123', role: 'staff',
      organizationId: org._id, emailVerified: true, status: 'active',
      departmentId: departments[0]?._id,
      staff: { title: 'Head of Operations', isWorkingToday: true, workArea: { city: 'Demo City' } },
      profile: { phone: '+919999999999', bio: 'Main demo staff account.' }
    });

    for (const dept of departments) {
      staffToInsert.push({
        name: `${dept.name} Technician`,
        email: `staff_${dept._id}@demo.citadel`,
        password: 'Password@123',
        role: 'staff',
        organizationId: org._id,
        emailVerified: true,
        status: 'active',
        departmentId: dept._id,
        staff: {
            title: `${dept.name} Specialist`,
            isWorkingToday: true,
            workArea: { city: 'Demo City' }
        },
        profile: { phone: '+919999999999', bio: 'Department specialist.' }
      });
    }
    await User.insertMany(staffToInsert);
  }

  // Seed a Complaint for EVERY Department
  const existingComplaintsCount = await Complaint.countDocuments({ organizationId: org._id });
  if (existingComplaintsCount === 0) {
    const demoCitizen = await User.findOne({ email: 'employee@demo.citadel' });
    const complaintsToInsert = [];
    
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      
      complaintsToInsert.push({
        title: `${dept.name} Request #${1000 + i}`,
        description: `This is an auto-generated demo complaint requiring attention from the ${dept.name} department.`,
        category: dept.categoriesHandled?.[0] || 'Other',
        priority: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        createdBy: demoCitizen._id,
        organizationId: org._id,
        assignedDepartmentId: dept._id,
        assignedTo: undefined,
        location: { lat: 28.6139 + (i * 0.001), lng: 77.209 + (i * 0.001) },
        reporterSnapshot: { name: demoCitizen.name, email: demoCitizen.email }
      });
    }
    await Complaint.insertMany(complaintsToInsert);
  }

  return org;
}

export async function loginDemoUser(req, res) {
  try {
    const { role } = req.params;
    const { departmentId } = req.body;
    
    const internalRole = role === 'employee' ? 'citizen' : role;
    const org = await setupDemoEnvironment();

    let targetUser;

    if (internalRole === 'staff') {
      if (departmentId) {
        targetUser = await User.findOne({ 
          organizationId: org._id, 
          role: 'staff', 
          departmentId: departmentId 
        });
      }
      if (!targetUser) {
        targetUser = await User.findOne({ 
          organizationId: org._id, 
          role: 'staff',
          email: 'staff@demo.citadel'
        });
      }
    } else if (internalRole === 'admin') {
      targetUser = await User.findOne({ organizationId: org._id, role: 'admin' });
    } else {
      targetUser = await User.findOne({ organizationId: org._id, role: 'citizen', email: 'employee@demo.citadel' });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Demo user not provisioned' });
    }

    const token = signToken(targetUser);

    res.json({
      token,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        organization: {
          id: org._id,
          name: org.name,
          code: org.code,
          plan: org.plan
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Demo login failed', details: err.message });
  }
}

export async function exitDemo(req, res) {
  try {
    const org = await Organization.findOne({ code: DEMO_ORG_CODE });
    if (org) {
      await User.deleteMany({ organizationId: org._id });
      await Complaint.deleteMany({ organizationId: org._id });
      console.log("🧹 Demo Corporation has been fully reset on exit.");
    }
    return res.json({ success: true, message: 'Demo sandbox cleaned up successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset demo sandbox', details: err.message });
  }
}

export async function getDemoDepartments(req, res) {
  try {
    const departments = await Department.find().select('_id name');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments', details: err.message });
  }
}
