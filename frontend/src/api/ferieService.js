import apiClient from './client';

export async function getHolidays() {
  const { data } = await apiClient.get('/ferie');
  return data;
}

export async function createHoliday({ date, description }) {
  const { data } = await apiClient.post('/ferie/create', { date, description });
  return data;
}

export async function deleteHoliday(date) {
  const { data } = await apiClient.delete(`/ferie/${encodeURIComponent(date)}`);
  return data;
}
