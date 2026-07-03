import apiClient from './client';

export async function getMenu({ category, maxPrice } = {}) {
  const { data } = await apiClient.get('/menu', {
    params: { category: category || undefined, max_price: maxPrice || undefined },
  });
  return data;
}

export async function getCategories() {
  const { data } = await apiClient.get('/menu/categories');
  return data;
}

export async function createMenuItem({ name, description, price, category }) {
  const { data } = await apiClient.post('/menu/create', { name, description, price, category });
  return data;
}

export async function updateMenuItem(id, { name, description, price, category }) {
  const { data } = await apiClient.put(`/menu/${id}`, { name, description, price, category });
  return data;
}

export async function deleteMenuItem(id) {
  const { data } = await apiClient.delete(`/menu/${id}`);
  return data;
}
