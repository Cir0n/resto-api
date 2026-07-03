import { useEffect, useState } from 'react';
import { createHoliday, deleteHoliday, getHolidays } from '../api/ferieService';
import Spinner from '../components/Spinner.jsx';
import { formatDate } from '../utils/format';
import { todayIso } from '../utils/openingSlots';

const EMPTY_FORM = { date: '', description: '' };

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);

  async function fetchHolidays() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Impossible de charger les jours fériés.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHolidays();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.date) {
      setError('La date est requise.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createHoliday(form);
      setForm(EMPTY_FORM);
      await fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Création impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(date) {
    if (!window.confirm('Supprimer ce jour férié ?')) return;
    setDeletingDate(date);
    try {
      await deleteHoliday(date);
      setHolidays((prev) => prev.filter((h) => h.date !== date));
    } catch (err) {
      setError(err.response?.data?.error ?? 'Suppression impossible.');
    } finally {
      setDeletingDate(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4">Jours fériés</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
        <div className="col-sm-4">
          <label htmlFor="date" className="form-label">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            className="form-control"
            min={todayIso()}
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-sm-5">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            className="form-control"
            placeholder="Ex : Pentecôte"
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div className="col-sm-3">
          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : holidays.length === 0 ? (
        <p className="text-muted">Aucun jour férié enregistré.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id}>
                  <td>{formatDate(h.date)}</td>
                  <td>{h.description || '—'}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(h.date)}
                      disabled={deletingDate === h.date}
                    >
                      {deletingDate === h.date ? '…' : 'Supprimer'}
                    </button>
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
