import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const payload = verifyToken(parts[1]);
        req.user = payload;
        return next();
    } catch (_err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
}


