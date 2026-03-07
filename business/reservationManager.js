
// Crée la reservation et met a jour toutes les données en base
async function reserve(req, connection, slotId, selectedTableIds){
    const { day_of_week, time, number_of_people, note } = req.body;
    const userId = req.user.id;

        // Crée la réservation
        const [resResult] = await connection.execute(
            'INSERT INTO reservations (user_id, day_of_week, time, number_of_people, note, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, day_of_week, time, number_of_people, note || null, "pending"]
        );
        const reservationId = resResult.insertId;

        // Marque les tables comme réservées et les lie à la réservation
        for (const tableId of selectedTableIds) {
            // Liaison reservation <-> table
            await connection.execute(
                'INSERT INTO reservation_tables (reservation_id, table_id) VALUES (?, ?)',
                [reservationId, tableId]
            );
            // Mise à jour de l'état de disponibilité
            await connection.execute(
                'UPDATE opening_slots_tables SET is_reserved = TRUE WHERE opening_slot_id = ? AND table_id = ?',
                [slotId, tableId]
            );
        }
        return reservationId;
}

module.exports = { reserve };