const pool = require('../config/db');

async function logAction(userId, action, details = null, severity = 'INFO') {
    const timestamp = new Date().toLocaleString();
    
    console.log(`[${severity}][${timestamp}] ${userId ? 'User #' + userId : 'System'}: ${action}`);
    if (details) console.log(` > Details: ${JSON.stringify(details)}`);
    
    try {
        await pool.execute(
            'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
            [userId, action, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error.message);
    }
}

module.exports = { logAction };