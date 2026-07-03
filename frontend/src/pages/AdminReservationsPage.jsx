import { useEffect, useState } from 'react';
import { cancelReservation, getAllReservations, validateReservation } from '../api/reservationService';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/reservations/StatusBadge.jsx';
import { formatDate } from '../utils/format';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'cancelled', label: 'Annulée' },
];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('date');
  const [pendingActionId, setPendingActionId] = useState(null);

  async function fetchReservations() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllReservations({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        sort: sort || undefined,
      });
      setReservations(data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Impossible de charger les réservations.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, statusFilter, sort]);

  async function handleValidate(id) {
    setPendingActionId(id);
    try {
      await validateReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'confirmed' } : r))
      );
    } catch (err) {
      setError(err.response?.data?.error ?? 'Validation impossible.');
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Confirmer l’annulation de cette réservation ?')) return;
    setPendingActionId(id);
    try {
      await cancelReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
      );
    } catch (err) {
      setError(err.response?.data?.error ?? 'Annulation impossible.');
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4">Gestion des réservations</h1>

      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <label htmlFor="dateFilter" className="form-label">
            Filtrer par date
          </label>
          <input
            type="date"
            id="dateFilter"
            className="form-control"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="col-sm-4">
          <label htmlFor="statusFilter" className="form-label">
            Filtrer par statut
          </label>
          <select
            id="statusFilter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-4">
          <label htmlFor="sort" className="form-label">
            Trier par
          </label>
          <select
            id="sort"
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Date</option>
            <option value="status">Statut</option>
            <option value="number_of_people">Nombre de personnes</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <Spinner />
      ) : reservations.length === 0 ? (
        <p className="text-muted">Aucune réservation ne correspond à ces filtres.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Client</th>
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
                  <td>
                    {r.fname} {r.lname}
                  </td>
                  <td>{formatDate(r.date)}</td>
                  <td>{String(r.time).slice(0, 5)}</td>
                  <td>{r.number_of_people}</td>
                  <td className="text-muted small">{r.note || '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        onClick={() => handleValidate(r.id)}
                        disabled={r.status !== 'pending' || pendingActionId === r.id}
                      >
                        Valider
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleCancel(r.id)}
                        disabled={r.status === 'cancelled' || pendingActionId === r.id}
                      >
                        Annuler
                      </button>
                    </div>
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
