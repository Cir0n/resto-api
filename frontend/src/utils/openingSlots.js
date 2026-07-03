// Reflète les créneaux définis dans database/init.sql (table opening_slots).
// Le backend ne les expose pas encore via une route dédiée, donc on les
// duplique ici pour piloter dynamiquement le <select> des horaires.
export const OPENING_SLOTS = {
  dimanche: ['12:00'],
  lundi: ['12:00', '19:00'],
  mardi: ['12:00', '19:00'],
  mercredi: ['13:00', '20:30'],
  jeudi: ['13:00', '19:00'],
  vendredi: ['12:00', '20:30'],
  samedi: ['19:00', '21:30'],
};

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function dayOfWeekFor(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return DAYS[date.getDay()];
}

export function slotsForDate(dateStr) {
  const day = dayOfWeekFor(dateStr);
  return day ? OPENING_SLOTS[day] ?? [] : [];
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}
