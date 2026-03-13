const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');
const { logAction } = require('../Utils/logger');


router.get('/', authMiddleware, async (req, res) => {
    try {
        const [feries] = await pool.query('SELECT id, date, description FROM holidays');
        res.json(feries);
        await logAction(req.user.id, 'SUCCESSFUL_RETRIEVAL_OF_HOLIDAYS', null, 'INFO');
    } catch (error) {
        await logAction(req.user.id, 'FAILED_TO_RETRIEVE_HOLIDAYS', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message });
    }
});

router.get('/:date', authMiddleware, async (req, res) => {
       const date = new Date(req.params.date);;
    try {
        const [feries] = await pool.query('SELECT id, date, description FROM holidays WHERE date = ?', [date]);
        if (feries.length === 0) {
            const err = new Error("Holiday not found.");
            err.errorCode = 404;
            throw err;
        }
        res.json(feries[0]);
        await logAction(req.user.id, 'SUCCESSFUL_RETRIEVAL_OF_HOLIDAY', { date: req.params.date }, 'INFO');
    } catch (error) {
        await logAction(req.user.id, 'FAILED_TO_RETRIEVE_HOLIDAY', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message });
    }
});

router.post('/create', authMiddleware, isAdmin, async (req, res) => {
    try {
        const description = req.body.description;
        const date = new Date(req.body.date);
        if (!date) {
            const err = new Error("No date was provided.");
            err.errorCode = 400;
            throw err;
        }
        const [check] = await pool.query('SELECT id FROM holidays WHERE date = ?', [date]);
        if (check.length > 0) {
            const err = new Error("A holiday already exists for this date.");
            err.errorCode = 400;
            throw err;
        }
        const [result] = await pool.query('INSERT INTO holidays (date, description) VALUES (?, ?)', [date, description]);
        res.status(201).json({ id: result.insertId, date, description });
        await logAction(req.user.id, 'SUCCESSFUL_CREATION_OF_HOLIDAY', { id: result.insertId }, 'INFO');
    } catch (error) {
        await logAction(req.user.id, 'FAILED_TO_CREATE_HOLIDAY', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message });
    }
});

router.delete('/:date', authMiddleware, isAdmin, async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const [result] = await pool.query('DELETE FROM holidays WHERE date = ?', [date]);
        if (result.affectedRows === 0) {
            const err = new Error("Holiday not found.");
            err.errorCode = 404;
            throw err;
        }
        res.json({ message: 'Holiday deleted successfully' });
        await logAction(req.user.id, 'SUCCESSFUL_DELETION_OF_HOLIDAY', { id: req.params.id }, 'INFO');
    } catch (error) {        
        await logAction(req.user.id, 'FAILED_TO_DELETE_HOLIDAY', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message });
    }
});

module.exports = router;