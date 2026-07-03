const LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-status-${status}`}>{LABELS[status] ?? status}</span>;
}
