import { useEffect, useMemo, useState } from 'react';
import { getCategories, getMenu } from '../../api/menuService';
import Spinner from '../Spinner.jsx';
import Categorie from './Categorie.jsx';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [menuByCategory, setMenuByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.map((c) => c.name)))
      .catch(() => setCategories(['entrées', 'plats', 'desserts']));
  }, []);

  // Débounce du prix max pour éviter une requête à chaque frappe.
  useEffect(() => {
    const timeout = setTimeout(() => setMaxPrice(maxPriceInput), 400);
    return () => clearTimeout(timeout);
  }, [maxPriceInput]);

  useEffect(() => {
    if (categories.length === 0) return;
    let cancelled = false;

    async function fetchMenu() {
      setIsLoading(true);
      setError('');
      try {
        const categoriesToLoad = categoryFilter ? [categoryFilter] : categories;
        const results = await Promise.all(
          categoriesToLoad.map((category) => getMenu({ category, maxPrice }))
        );
        if (!cancelled) {
          const grouped = {};
          categoriesToLoad.forEach((category, index) => {
            grouped[category] = results[index];
          });
          setMenuByCategory(grouped);
        }
      } catch {
        if (!cancelled) setError('Impossible de charger le menu pour le moment.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMenu();
    return () => {
      cancelled = true;
    };
  }, [categories, categoryFilter, maxPrice]);

  const filteredMenu = useMemo(() => {
    if (!search.trim()) return menuByCategory;
    const term = search.trim().toLowerCase();
    const filtered = {};
    Object.entries(menuByCategory).forEach(([category, plats]) => {
      filtered[category] = plats.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term)
      );
    });
    return filtered;
  }, [menuByCategory, search]);

  const categoriesToDisplay = Object.keys(filteredMenu);

  return (
    <div>
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-sm-4">
          <label htmlFor="categoryFilter" className="form-label">
            Catégorie
          </label>
          <select
            id="categoryFilter"
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category} className="text-capitalize">
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-3">
          <label htmlFor="maxPrice" className="form-label">
            Prix max (€)
          </label>
          <input
            type="number"
            id="maxPrice"
            className="form-control"
            min={0}
            step="0.5"
            placeholder="Aucun maximum"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
          />
        </div>
        <div className="col-sm-5">
          <label htmlFor="search" className="form-label">
            Rechercher
          </label>
          <input
            type="search"
            id="search"
            className="form-control"
            placeholder="Nom ou description du plat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Chargement du menu…" />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : categoriesToDisplay.every((c) => filteredMenu[c].length === 0) ? (
        <p className="text-muted">Aucun plat ne correspond à ces critères.</p>
      ) : (
        categoriesToDisplay.map((category) => (
          <Categorie key={category} name={category} plats={filteredMenu[category]} />
        ))
      )}
    </div>
  );
}
