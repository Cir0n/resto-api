const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');
const { assign } = require('../business/tableManager');
const { reserve } = require('../business/reservationManager');

router.post('/create', authMiddleware, async (req, res) => {
    const { day_of_week, time, number_of_people, note } = req.body;
    const userId = req.user.id;
    let peopleToPlace = number_of_people;

    const connection = await pool.getConnection(); // On récupère une connexion pour la transaction
    try {
        await connection.beginTransaction();

        // Récupére le créneau d'ouverture
        const [slots] = await connection.execute(
            'SELECT id FROM opening_slots WHERE day_of_week = ? AND time = ?',
            [day_of_week, time]
        );

        if (slots.length === 0) {
            throw new Error("Ce créneau n'existe pas.");
        }
        const slotId = slots[0].id;
        
        const selectedTableIds = await assign(connection, res, peopleToPlace, slotId);
        console.log("selectedTableIds: " + selectedTableIds);

        if (selectedTableIds.status == 500) 
            throw new Error(selectedTableIds.error);
        const reservationId = await reserve(req, connection, slotId, selectedTableIds);

        await connection.commit();
        res.status(201).json({ message: 'Réservation confirmée', reservationId, tables: selectedTableIds });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});


router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const [reservations] = await pool.query(`
            SELECT r.id, r.day_of_week, r.time, r.number_of_people, r.note, r.status, u.fname, u.lname
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
            'SELECT id, day_of_week, time, number_of_people, note FROM reservations WHERE user_id = ?',
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
    const { day_of_week, time, number_of_people, note } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT status FROM reservations WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        
        if (rows[0].status === 'cancelled') {
            return res.status(400).json({ error: 'Impossible de modifier une réservation annulée' });
        }

        if (rows[0].status === 'confirmed') {
            return res.status(400).json({ error: 'Impossible de modifier une réservation confirmée' });
        }

        const [result] = await pool.query(
            'UPDATE reservations SET day_of_week = ?, time = ?, number_of_people = ?, note = ? WHERE id = ? AND user_id = ?',
            [day_of_week, time, number_of_people, note, reservationId, userId]
        );
        res.status(200).json({ message: 'Réservation mise à jour avec succès' });
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
            return res.status(400).json({ error: 'La réservation est déjà annulée' });
        }

        const [result] = await pool.query(
            'UPDATE reservations SET status = "cancelled" WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        res.status(200).json({ message: 'Réservation annulée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/validate', authMiddleware, isAdmin, async (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.id;
    try {

    const [rows] = await pool.query(
            'SELECT status FROM reservations WHERE id = ?',
            [reservationId]
        );

        if (!rows[0]) {
            return res.status(400).json({ error: 'Pas de réservation à cet ID' });
        }

        if (rows[0].status === 'cancelled') {
            return res.status(400).json({ error: 'Impossible de valider une réservation annulée' });
        }

        if (rows[0].status === 'confirmed') {
            return res.status(400).json({ error: 'La réservation est déjà validée' });
        }

        const [result] = await pool.query(
            'UPDATE reservations SET status = "confirmed" WHERE id = ?',
            [reservationId]
        );
        res.status(200).json({ message: 'Réservation validée avec succès' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;