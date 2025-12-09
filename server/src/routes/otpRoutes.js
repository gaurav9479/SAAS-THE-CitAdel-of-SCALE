import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// Verify email OTP (signup flow)
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerified) return res.json({ message: 'Already verified' });
        if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or missing' });
        }
        if (user.emailOtp !== code) {
            return res.status(400).json({ message: 'Invalid code' });
        }
        user.emailVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        await user.save();
        return res.json({ message: 'Email verified' });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to verify email', details: e.message });
    }
});

export default router;


