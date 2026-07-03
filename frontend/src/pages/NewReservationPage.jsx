import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReservation } from '../api/reservationService';
import ReservationForm from '../components/reservations/ReservationForm.jsx';

export default function NewReservationPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values) {
    setServerError('');
    setIsSubmitting(true);
    try {
      await createReservation(values);
      navigate('/my-reservations');
    } catch (err) {
      setServerError(err.response?.data?.error ?? 'La réservation a échoué.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <h1 className="mb-4">Nouvelle réservation</h1>
        <ReservationForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          serverError={serverError}
          submitLabel="Confirmer la réservation"
        />
      </div>
    </div>
  );
}
