import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelReservation, getMyReservations } from '../api/reservationService';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/reservations/StatusBadge.jsx';
import { formatDate } from '../utils/format';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  async function fetchReservations() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getMyReservations();
      setReservations(data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Impossible de charger vos réservations.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  async function handleCancel(id) {
    if (!window.confirm('Confirmer l’annulation de cette réservation ?')) return;
    setCancellingId(id);
    try {
      await cancelReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
      );
    } catch (err) {
      setError(err.response?.data?.error ?? 'Annulation impossible.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mes réservations</h1>
        <Link to="/reservations/new" className="btn btn-primary">
          Nouvelle réservation
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <Spinner />
      ) : reservations.length === 0 ? (
        <p className="text-muted">Vous n’avez aucune réservation pour le moment.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Personnes</th>
                <th>Note</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{String(r.time).slice(0, 5)}</td>
                  <td>{r.number_of_people}</td>
                  <td className="text-muted small">{r.note || '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-end">
                    {r.status !== 'cancelled' && (
                      <div className="btn-group btn-group-sm">
                        <Link to={`/reservations/${r.id}/edit`} className="btn btn-outline-secondary">
                          Modifier
                        </Link>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                        >
                          {cancellingId === r.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
