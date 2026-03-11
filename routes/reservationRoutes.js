const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');
const { assign } = require('../business/tableManager');
const { reserve } = require('../business/reservationManager');
const { logAction } = require('../Utils/logger');

// mapper Date.getDay() vers jours de la semaine
const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

router.post('/create', authMiddleware, async (req, res) => {
    const { time, number_of_people } = req.body;
    const date = new Date(req.body.date);
    const userId = req.user.id;

    const connection = await pool.getConnection(); // On récupère une connexion pour la transaction
    try {
        await connection.beginTransaction();

        // Récupère l'ID du créneau correspondant au jour et à l'heure demandés
        const [slots] = await connection.execute(
            'SELECT id FROM opening_slots WHERE day_of_week = ? AND time = ?',
            [days[date.getDay()], time]
        );

        if (slots.length === 0) {
            err = new Error("Ce créneau n'existe pas.");
            err.errorCode = 400;
            throw err;
        }
        const slotId = slots[0].id;

        // Retourne le nombre de places restantes pour ce créneau à cette date
        const [seats] = await connection.execute(`
            SELECT COALESCE(SUM(t.seats), 0) AS remaining
            FROM tables t
            WHERE t.id NOT IN (
            SELECT rt.table_id
            FROM reservation_tables rt
            JOIN reservations r ON rt.reservation_id = r.id
            WHERE r.date = ?
            AND r.opening_slot_id = ?
            AND r.status != 'cancelled'
     )`,
            [date, slotId]
        );

        if (parseInt(seats[0].remaining) < parseInt(number_of_people)) {
            err = new Error("Il reste seulement " + seats[0].remaining + 
                " places disponibles pour ce créneau contre les " + number_of_people + " places demandées.");
            err.errorCode = 400;
            throw err;
        }
        
        const selectedTableIds = await assign(userId, connection, number_of_people, slotId, date);

        if (selectedTableIds?.status == 500) {
            err = new Error(selectedTableIds.error);
            err.errorCode = 400;
            throw err;
        }

        const reservationId = await reserve(req, connection, selectedTableIds, slotId);

        await connection.commit();
        res.status(201).json({ message: 'Réservation confirmée', reservationId, date: date, slotId, userId, tables: selectedTableIds });
        
    } catch (error) {
        await connection.rollback();
        await logAction(userId, 'ROLLBACK', null, 'WARN');
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(userId, 'FAILED_RESERVATION', { error: error.message, reservationId:reservationId }, 'ERROR');
    } finally {
        connection.release();
    }
});


router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const [reservations] = await pool.query(`
            SELECT r.id, r.date, os.day_of_week, os.time, r.number_of_people, r.note, r.status, u.fname, u.lname
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN opening_slots os ON r.opening_slot_id = os.id`)
        res.json(reservations);
        await logAction(req.user.id, 'SUCCESSFUL_RETRIEVAL_OF_RESERVATIONS', null, 'INFO');
    } catch (error) {
        await logAction(req.user.id, 'FAILED_TO_RETRIEVE_RESERVATIONS', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message, reservationId:reservationId });
    }
});

router.get('/my-reservations', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const [reservations] = await pool.query(`
            SELECT r.id, r.date, os.day_of_week, os.time, r.number_of_people, r.note, r.status
            FROM reservations r
            JOIN opening_slots os ON r.opening_slot_id = os.id
            WHERE r.user_id = ?`,
            [userId]
        );

        res.json(reservations);
        await logAction(req.user.id, 'SUCCESSFUL_RETRIEVAL_OF_MY_RESERVATIONS', null, 'INFO');
    } catch (error) {
        await logAction(req.user.id, 'FAILED_TO_RETRIEVE_MY_RESERVATIONS', { error: error.message }, 'ERROR');
        res.status(error.errorCode || 500).json({ error: error.message, reservationId:reservationId });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    const reservationId = req.params.id;
    const userId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Vérification de l'état actuel de la réservation
        const [rows] = await connection.execute(
            'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        const time = req.body.time ?? rows[0].time;
        const number_of_people = req.body.number_of_people ?? rows[0].number_of_people;
        const note = req.body.note ?? rows[0].note;
        const date = req.body.date ? new Date(req.body.date) : rows[0].date;
        const day_of_week = days[date.getDay()];

        if (!rows[0]) {
            err = new Error("Réservation introuvable pour cet ID.");
            err.errorCode = 400;
            throw err;
        }
        if (rows[0].status === 'cancelled') {
            err = new Error("Impossible de modifier une réservation annulée.");
            err.errorCode = 400;
            throw err;
        }


        // Récupérer le nouvel ID de créneau (opening_slot_id)
        const [slots] = await connection.execute(
            'SELECT id FROM opening_slots WHERE day_of_week = ? AND time = ?',
            [day_of_week, time]
        );
        if (!slots[0]) {
            err = new Error("Ce créneau n'existe pas.");
            err.errorCode = 400;
            throw err;
        }
        const slotId = slots[0].id;

        await connection.execute('DELETE FROM reservation_tables WHERE reservation_id = ?', [reservationId]);
        await logAction(req.user.id, 'SUCCESSFUL_DELETION_OF_RESERVATION_TABLES', { 
            reservationId : reservationId
        }, 'INFO');

        // Vérifier la disponibilité des tables pour le nouveau créneau 
        const [seats] = await connection.execute(
            `SELECT COALESCE(SUM(t.seats), 0) AS remaining
             FROM tables t
             WHERE t.id NOT IN (
                 SELECT rt.table_id
                 FROM reservation_tables rt
                 JOIN reservations r ON rt.reservation_id = r.id
                 WHERE r.date = ?
                   AND r.opening_slot_id = ?
                   AND r.status != 'cancelled'
             )`,
            [date, slotId]
        );

        if (parseInt(seats[0].remaining) < parseInt(number_of_people)) {
            err = new Error("Il reste seulement " + seats[0].remaining + 
                " places disponibles pour ce créneau contre les " + number_of_people + " places demandées.");
            err.errorCode = 400;
            throw err;
        }


        // Ré-assigner les tables
        const selectedTableIds = await assign(userId, connection, number_of_people, slotId, date);

        // Mettre à jour la réservation principale
        await connection.execute(
            `UPDATE reservations 
             SET date = ?, opening_slot_id = ?, number_of_people = ?, note = ?, status = 'pending' 
             WHERE id = ?`,
            [date, slotId, number_of_people, note || null, reservationId]
        );
        await logAction(req.user.id, 'SUCCESSFUL_UPDATE_OF_RESERVATION', { 
            reservationId : reservationId,
            newSlotId: slotId,
            newDate: date, 
            newPeople: number_of_people,
            newNote: note ? note : null
        }, 'INFO');

        // Lier les nouvelles tables
        for (const tableId of selectedTableIds) {
            await connection.execute(
                'INSERT INTO reservation_tables (reservation_id, table_id) VALUES (?, ?)',
                [reservationId, tableId]
            );
        }
        await logAction(req.user.id, 'SUCCESSFUL_UPDATE_OF_RESERVATION_TABLES', { 
            reservationId : reservationId
        }, 'INFO');

        await connection.commit();
        res.status(200).json({ message: 'Réservation mise à jour avec succès', tables: selectedTableIds });

    } catch (error) {
        await connection.rollback(); // En cas d'erreur, les anciennes tables sont restaurées en base
        await logAction(req.user.id, 'ROLLBACK', null, 'WARN');
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(req.user.id, 'FAILED_TO_UPDATE_RESERVATION', { error: error.message, reservationId: reservationId }, 'ERROR');
    } finally {
        connection.release();
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
        
        if (!rows[0]) {
            err = new Error("Pas de réservation à cet ID.");
            err.errorCode = 400;
            throw err;
        }

        if (rows[0].status === 'cancelled') {
            err = new Error("La réservation est déjà annulée.");
            err.errorCode = 400;
            throw err;
        }

        const [result] = await pool.query(
            'UPDATE reservations SET status = "cancelled" WHERE id = ? AND user_id = ?',
            [reservationId, userId]
        );
        res.status(200).json({ message: 'Réservation annulée avec succès' });
        await logAction(userId, 'SUCCESSFUL_CANCEL_RESERVATION', { reservationId: reservationId }, 'INFO');
    } catch (error) {
        res.status(error.errorCode || 500).json({ error: error.message});
        await logAction(userId, 'FAILED_TO_CANCEL_RESERVATION', { error: error.message, reservationId:reservationId }, 'ERROR');
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
            err = new Error("Pas de réservation à cet ID.");
            err.errorCode = 400;
            throw err;
        }

        if (rows[0].status === 'cancelled') {
            err = new Error("Impossible de valider une réservation annulée.");
            err.errorCode = 400;
            throw err;
        }

        if (rows[0].status === 'confirmed') {
            err = new Error("La réservation est déjà validée.");
            err.errorCode = 400;
            throw err;
        }

        const [result] = await pool.query(
            'UPDATE reservations SET status = "confirmed" WHERE id = ?',
            [reservationId]
        );
        res.status(200).json({ message: 'Réservation validée avec succès.' });
        await logAction(userId, 'SUCCESSFUL_VALIDATE_RESERVATION', { reservationId: reservationId }, 'INFO');

    } catch (error) {
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(userId, 'FAILED_TO_VALIDATE_RESERVATION', { error: error.message, reservationId:reservationId }, 'ERROR');
    }
});



module.exports = router;