import apiClient from './client';

export async function createReservation({ date, time, number_of_people, note }) {
  const { data } = await apiClient.post('/reservations/create', {
    date,
    time,
    number_of_people,
    note,
  });
  return data;
}

export async function getMyReservations() {
  const { data } = await apiClient.get('/reservations/my-reservations');
  return data;
}

export async function updateReservation(id, { date, time, number_of_people, note }) {
  const { data } = await apiClient.put(`/reservations/${id}`, {
    date,
    time,
    number_of_people,
    note,
  });
  return data;
}

export async function cancelReservation(id) {
  const { data } = await apiClient.delete(`/reservations/${id}`);
  return data;
}

export async function getAllReservations({ date, status, sort } = {}) {
  const { data } = await apiClient.get('/reservations', {
    params: { date, status, sort },
  });
  return data;
}

export async function validateReservation(id) {
  const { data } = await apiClient.patch(`/reservations/${id}/validate`);
  return data;
}
