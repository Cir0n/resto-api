import apiClient from './client';

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function signup({ email, password, fname, lname, phone }) {
  const { data } = await apiClient.post('/auth/signup', {
    email,
    password,
    fname,
    lname,
    phone,
  });
  return data;
}
