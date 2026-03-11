const jwt = require ('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const { logAction } = require('../Utils/logger');

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logAction(null, 'MISSING_ACCESS_TOKEN', { route: req.originalUrl }, 'ERROR');
        return res.status(401).json({ error: 'Access token missing' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.userId, role: payload.role };
        next();
    } catch (error) {
        logAction(null, 'INVALID_OR_EXPIRED_TOKEN', { error: error.message, route: req.originalUrl }, 'ERROR');
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}


module.exports = { authMiddleware };