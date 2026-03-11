const { logAction } = require('../Utils/logger');

// Selectionne la/les tables de la reservation et renvoie leur ID
async function assign(userId, connection, peopleToPlace, slotId, date){
    console.log("execute type:", typeof connection.execute);
    const number_of_people = peopleToPlace; // keep original number for logging
        // Récupérer les tables libres pour ce créneau
        const [availableTables] = await connection.execute(`
            SELECT t.id, t.seats
            FROM tables t
            WHERE NOT EXISTS (
                SELECT 1 FROM reservation_tables rt
                JOIN reservations r ON rt.reservation_id = r.id
                WHERE rt.table_id = t.id AND r.status != 'cancelled'
                AND r.opening_slot_id = ? AND r.date = ? 
            )`, [slotId, date]);

        const tableForSix = [];
        const tableForFour = [];
        const tableForTwo = [];
        // Tri dans des listes de tables avec differentes quantitées de places
        for (const table of availableTables) {
            if (table.seats == 2)  
                tableForTwo.push(table.id);
            else if (table.seats == 4)  
                tableForFour.push(table.id);
            else if (table.seats == 6)  
                tableForSix.push(table.id);
            else
                throw new Error("Nombre de places en base d'une table incorrect.");
        }

        const selectedTableIds = [];

        // Algorithme d'assignation
        while (peopleToPlace > 0) {
            if (tableForSix.length <= 0 && tableForFour.length <= 0 && tableForTwo.length <= 0){
                throw new Error("Plus de place disponible pour ce nombre de personnes à se créneau.");
            }
            switch (true) {
                case peopleToPlace > 4:
                    if (tableForSix.length > 0) {
                        selectedTableIds.push(tableForSix.pop());
                        peopleToPlace -= 6;
                    } else if (tableForFour.length > 0){
                        selectedTableIds.push(tableForFour.pop());
                        peopleToPlace -= 4;
                    } else if (tableForTwo.length > 0){
                        selectedTableIds.push(tableForTwo.pop());
                        peopleToPlace -= 2;
                    }
                    break;
                case peopleToPlace > 2:
                    if (tableForFour.length > 0){
                        selectedTableIds.push(tableForFour.pop());
                        peopleToPlace -= 4;
                    } else if (tableForTwo.length > 0){
                        selectedTableIds.push(tableForTwo.pop());
                        peopleToPlace -= 2;
                    } else if (tableForSix.length > 0) {
                        selectedTableIds.push(tableForSix.pop());
                        peopleToPlace -= 6;
                    }
                    break;
                default:
                    if (tableForTwo.length > 0){
                        selectedTableIds.push(tableForTwo.pop());
                        peopleToPlace -= 2;
                    } else if (tableForFour.length > 0){
                        selectedTableIds.push(tableForFour.pop());
                        peopleToPlace -= 4;
                    } else if (tableForSix.length > 0) {
                        selectedTableIds.push(tableForSix.pop());
                        peopleToPlace -= 6;
                    }
                    break;
            }
        }
        await logAction(userId, 'Table_Assignment', { 
            selectedTableIds : selectedTableIds,
            slotId: slotId,
            date: date, 
            number_of_people: number_of_people 
        }, 'INFO');
        return selectedTableIds;
}


module.exports = { assign };