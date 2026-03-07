// Selectionne la/les tables de la reservation et renvoie leur ID
async function assign(connection, res, peopleToPlace, slotId){
        // Récupérer les tables libres pour ce créneau
        const [availableTables] = await connection.execute(`
            SELECT t.id, t.seats 
            FROM \`tables\` t
            JOIN opening_slots_tables ost ON t.id = ost.table_id
            WHERE ost.opening_slot_id = ? AND ost.is_reserved = FALSE
        `, [slotId]);

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
                await connection.rollback();
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
        
        return selectedTableIds;
}


module.exports = { assign };