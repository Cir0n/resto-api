const { logAction } = require('../Utils/logger');

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        logAction(req.user.id, 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', 
            { route: req.originalUrl }, 'ERROR');
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = { isAdmin };