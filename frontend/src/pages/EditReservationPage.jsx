import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyReservations, updateReservation } from '../api/reservationService';
import ReservationForm from '../components/reservations/ReservationForm.jsx';
import Spinner from '../components/Spinner.jsx';
import { toDateInputValue, toTimeInputValue } from '../utils/format';

export default function EditReservationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchReservation() {
      setIsLoading(true);
      setLoadError('');
      try {
        const reservations = await getMyReservations();
        const reservation = reservations.find((r) => String(r.id) === id);
        if (!reservation) {
          setLoadError('Réservation introuvable.');
          return;
        }
        setInitialValues({
          date: toDateInputValue(reservation.date),
          time: toTimeInputValue(reservation.time),
          number_of_people: reservation.number_of_people,
          note: reservation.note ?? '',
        });
      } catch (err) {
        setLoadError(err.response?.data?.error ?? 'Impossible de charger la réservation.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchReservation();
  }, [id]);

  async function handleSubmit(values) {
    setServerError('');
    setIsSubmitting(true);
    try {
      await updateReservation(id, values);
      navigate('/my-reservations');
    } catch (err) {
      setServerError(err.response?.data?.error ?? 'La mise à jour a échoué.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <h1 className="mb-4">Modifier la réservation</h1>
        {isLoading ? (
          <Spinner />
        ) : loadError ? (
          <div className="alert alert-danger">{loadError}</div>
        ) : (
          <ReservationForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            serverError={serverError}
            submitLabel="Enregistrer les modifications"
          />
        )}
      </div>
    </div>
  );
}
