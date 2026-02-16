const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');

router.post('/create', authMiddleware, async (req, res) => {
    const { date, time, number_of_people, note } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await pool.query(
            'INSERT INTO reservations (user_id, date, time, number_of_people, note) VALUES (?, ?, ?, ?, ?)',
            [userId, date, time, number_of_people, note]
        );
        res.status(201).json({ message: 'Reservation created', reservationId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const [reservations] = await pool.query(`
            SELECT r.id, r.date, r.time, r.number_of_people, r.note, u.fname, u.lname
            FROM reservations r
            JOIN users u ON r.user_id = u.id`)
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my-reservations', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const [reservations] = await pool.query(
            'SELECT id, date, time, number_of_people, note FROM reservations WHERE user_id = ?',
            [userId]
        );
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;