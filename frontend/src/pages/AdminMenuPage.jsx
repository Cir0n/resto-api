import { useEffect, useState } from 'react';
import {
  createMenuItem,
  deleteMenuItem,
  getCategories,
  getMenu,
  updateMenuItem,
} from '../api/menuService';
import Spinner from '../components/Spinner.jsx';

const EMPTY_FORM = { name: '', description: '', price: '', category: '' };

export default function AdminMenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function fetchAll() {
    setIsLoading(true);
    setError('');
    try {
      const categoryList = await getCategories();
      setCategories(categoryList);
      const results = await Promise.all(
        categoryList.map(async (c) => {
          const plats = await getMenu({ category: c.name });
          return plats.map((p) => ({ ...p, category: c.name }));
        })
      );
      setItems(results.flat());
    } catch (err) {
      setError(err.response?.data?.error ?? 'Impossible de charger le menu.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.price || !form.category) {
      setError('Nom, prix et catégorie sont requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMenuItem(editingId, form);
      } else {
        await createMenuItem(form);
      }
      cancelEdit();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Enregistrement impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce plat du menu ?')) return;
    setDeletingId(id);
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.response?.data?.error ?? 'Suppression impossible.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4">Gestion du menu</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
        <div className="col-sm-3">
          <label htmlFor="name" className="form-label">
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-sm-4">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div className="col-sm-2">
          <label htmlFor="price" className="form-label">
            Prix (€)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            className="form-control"
            min={0}
            step="0.5"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-sm-2">
          <label htmlFor="category" className="form-label">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="text-capitalize">
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-1 d-flex flex-column gap-2">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="text-muted small">{item.description || '—'}</td>
                  <td>{Number(item.price).toFixed(2)} €</td>
                  <td className="text-capitalize">{item.category}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => startEdit(item)}>
                        Modifier
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? '…' : 'Supprimer'}
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
