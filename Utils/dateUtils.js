const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Calcule le jour de la semaine à partir d'une chaîne 'YYYY-MM-DD' en parsant
// explicitement en UTC : évite tout décalage lié au fuseau horaire du serveur
// (voir bug où new Date('YYYY-MM-DD').getDay() en heure locale + la
// sérialisation mysql2 des objets Date faisaient échouer silencieusement les
// comparaisons `WHERE date = ?` en base).
function dayOfWeek(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

module.exports = { DAYS, dayOfWeek };
