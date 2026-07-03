const { logAction } = require('../Utils/logger');

// Crée la reservation et met a jour toutes les données en base
async function reserve(req, connection, selectedTableIds, slotId){
    const { date, number_of_people, note } = req.body;
    const userId = req.user.id;
        // Crée la réservation
        const [resResult] = await connection.execute(
            'INSERT INTO reservations (user_id, date, number_of_people, opening_slot_id, note, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, date, number_of_people, slotId, note || null, "pending"]
        );
        const reservationId = resResult.insertId;
        await logAction(userId, 'Reservation_table_populated', {
            reservationId: reservationId,
            slotId: slotId,
            date: date
        }, 'INFO');

        // Marque les tables comme réservées et les lie à la réservation
        for (const tableId of selectedTableIds) {
            // Liaison reservation <-> table
            await connection.execute(
                'INSERT INTO reservation_tables (reservation_id, table_id) VALUES (?, ?)',
                [reservationId, tableId]
            );
        }
        await logAction(userId, 'Reservation_Tables_table_populated', {
            reservationId: reservationId,
            slotId: slotId,
            date: date, 
            people: number_of_people 
        }, 'INFO');
        return reservationId;
}

module.exports = { reserve };