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

router.put('/:id', authMiddleware, async (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.id;
    const { date, time, number_of_people, note } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT status FROM reservations WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        
        if (rows[0].status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot update a cancelled reservation' });
        }

        const [result] = await pool.query(
            'UPDATE reservations SET date = ?, time = ?, number_of_people = ?, note = ? WHERE id = ? AND user_id = ?',
            [date, time, number_of_people, note, reservationId, userId]
        );
        res.status(200).json({ message: 'Reservation updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.id;
    try {

        const [rows] = await pool.query(
            'SELECT status FROM reservations WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );

        if (rows[0].status === 'cancelled') {
            return res.status(400).json({ message: 'Reservation is already cancelled' });
        }

        const [result] = await pool.query(
            'UPDATE reservations SET status = "cancelled" WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        res.status(200).json({ message: 'Reservation cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;