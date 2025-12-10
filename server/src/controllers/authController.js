import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { signToken } from '../utils/jwt.js';
import { getPlanFeatures } from '../utils/plan.js';
import { generateOrgCode } from '../utils/orgCode.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { sendEmail } from '../utils/email.js';

function isValidINPhone(phone) {
    if (!phone) return true; // optional overall, validate if provided
    const parsed = parsePhoneNumberFromString(phone, 'IN');
    return !!(parsed && parsed.isValid() && parsed.country === 'IN');
}

function genOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function register(req, res) {
    try {
        const { name, email, password, role, phone, departmentId, staff, organizationId, organizationCode, organizationName } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        if (!isValidINPhone(phone)) {
            return res.status(400).json({ message: 'Invalid Indian phone number. Use +91XXXXXXXXXX' });
        }
        let org = null;

        // Admin can create or pick org via code; other roles must provide an org code
        if (role === 'admin') {
            if (organizationId) {
                org = await Organization.findById(organizationId);
                if (!org) return res.status(400).json({ message: 'Organization not found' });
            } else if (organizationCode) {
                const code = organizationCode.trim().toUpperCase();
                const exists = await Organization.findOne({ code });
                if (exists) return res.status(409).json({ message: 'Organization code already taken' });
                org = await Organization.create({ name: organizationName || `${name}'s Org`, plan: 'free', code });
            } else {
                // autogenerate unique code
                let code;
                do {
                    code = generateOrgCode(8);
                } while (await Organization.findOne({ code }));
                org = await Organization.create({ name: organizationName || `${name}'s Org`, plan: 'free', code });
            }
        } else {
            // non-admin: must provide code or existing org id; fallback to default individual org if configured
            if (organizationCode) {
                org = await Organization.findOne({ code: organizationCode.trim().toUpperCase() });
                if (!org) return res.status(400).json({ message: 'Invalid organization code' });
            } else if (organizationId) {
                org = await Organization.findById(organizationId);
                if (!org) return res.status(400).json({ message: 'Organization not found' });
            } else {
                // fallback: join default individual org (code: INDIVIDUAL) if it exists
                org = await Organization.findOne({ code: 'INDIVIDUAL' }) || await Organization.findOne();
                if (!org) return res.status(400).json({ message: 'Organization code required' });
            }
        }

        const payload = { name, email, password, role, organizationId: org._id };
        if (phone) payload.profile = { phone };
        if (departmentId) payload.departmentId = departmentId;
        if (staff) {
            // If registering staff, require workArea.location coordinates
            if (role === 'staff') {
                const hasCoords = staff?.workArea?.location?.lat !== undefined && staff?.workArea?.location?.lng !== undefined;
                if (!hasCoords) {
                    return res.status(400).json({ message: 'Staff registration requires working area coordinates (lat,lng)' });
                }
            }
            payload.staff = staff;
        }
        // Email OTP
        const otp = genOtp();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        payload.emailOtp = otp;
        payload.emailOtpExpires = otpExpires;
        payload.emailVerified = false;

        await User.create(payload);
        // Send OTP email (or log in dev)
        try {
            await sendEmail({
                to: email,
                subject: 'Verify your email',
                text: `Your verification code is ${otp}. It expires in 15 minutes.`,
            });
        } catch (e) {
            console.log(`Email OTP for ${email}: ${otp} (email send failed: ${e.message})`);
        }

        return res.status(201).json({
            emailVerificationRequired: true,
            message: 'Verify your email with the OTP sent',
            otp: process.env.DEV_RETURN_OTP === 'true' ? otp : undefined,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Registration failed', details: err.message });
    }
}

export async function login(req, res) {
    try {
        const { email, password, code } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const ok = await user.comparePassword(password);
        if (!ok) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.emailVerified) {
            // allow inline verify on login
            if (code && user.emailOtp === code && user.emailOtpExpires && user.emailOtpExpires > new Date()) {
                user.emailVerified = true;
                user.emailOtp = undefined;
                user.emailOtpExpires = undefined;
                await user.save();
            } else {
                return res.status(403).json({ message: 'Email not verified. Provide OTP code to complete login.', emailVerificationRequired: true });
            }
        }
        const org = user.organizationId ? await Organization.findById(user.organizationId) : await Organization.findOne();
        const orgPlan = org?.plan || 'free';
        const orgFeatures = getPlanFeatures(orgPlan);
        const token = signToken({ id: user._id, role: user.role, name: user.name, organizationId: org?._id, plan: orgPlan });
        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: org
                    ? { id: org._id, name: org.name, code: org.code, plan: orgPlan, features: orgFeatures }
                    : undefined
            }
        });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', details: err.message });
    }
}

export async function me(req, res) {
    try {
        // req.user is set by requireAuth
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const user = await User.findById(userId).select('_id name email role organizationId');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const org = user.organizationId ? await Organization.findById(user.organizationId) : await Organization.findOne();
        const orgPlan = org?.plan || 'free';
        const orgFeatures = getPlanFeatures(orgPlan);
        return res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: org
                    ? { id: org._id, name: org.name, code: org.code, plan: orgPlan, features: orgFeatures }
                    : undefined
            }
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch current user', details: err.message });
    }
}


