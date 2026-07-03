import { useEffect, useMemo, useState } from 'react';
import { slotsForDate, todayIso } from '../../utils/openingSlots';

const EMPTY = { date: '', time: '', number_of_people: 2, note: '' };

export default function ReservationForm({
  initialValues = EMPTY,
  onSubmit,
  submitLabel = 'Réserver',
  isSubmitting = false,
  serverError = '',
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setValues({ ...EMPTY, ...initialValues });
  }, [initialValues]);

  const availableSlots = useMemo(() => slotsForDate(values.date), [values.date]);
  const minDate = todayIso();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setValidationError('');

    if (!values.date || !values.time || !values.number_of_people) {
      setValidationError('Merci de renseigner la date, l’heure et le nombre de personnes.');
      return;
    }
    if (values.date < minDate) {
      setValidationError('La date doit être aujourd’hui ou dans le futur.');
      return;
    }
    if (Number(values.number_of_people) < 1) {
      setValidationError('Le nombre de personnes doit être d’au moins 1.');
      return;
    }

    onSubmit({
      date: values.date,
      time: values.time,
      number_of_people: Number(values.number_of_people),
      note: values.note,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {(validationError || serverError) && (
        <div className="alert alert-danger">{validationError || serverError}</div>
      )}

      <div className="mb-3">
        <label htmlFor="date" className="form-label">
          Date
        </label>
        <input
          type="date"
          className="form-control"
          id="date"
          name="date"
          min={minDate}
          value={values.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="time" className="form-label">
          Heure
        </label>
        <select
          className="form-select"
          id="time"
          name="time"
          value={values.time}
          onChange={handleChange}
          required
          disabled={!values.date}
        >
          <option value="">
            {values.date ? 'Choisissez un horaire' : 'Sélectionnez d’abord une date'}
          </option>
          {availableSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
        {values.date && availableSlots.length === 0 && (
          <div className="form-text text-danger">
            Le restaurant est fermé ce jour-là, choisissez une autre date.
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="number_of_people" className="form-label">
          Nombre de personnes
        </label>
        <input
          type="number"
          className="form-control"
          id="number_of_people"
          name="number_of_people"
          min={1}
          value={values.number_of_people}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="note" className="form-label">
          Note (allergies, occasion particulière…)
        </label>
        <textarea
          className="form-control"
          id="note"
          name="note"
          rows={3}
          value={values.note ?? ''}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi…' : submitLabel}
      </button>
    </form>
  );
}
