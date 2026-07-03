import Plat from './Plat.jsx';

export default function Categorie({ name, plats }) {
  return (
    <section className="mb-5">
      <h2 className="text-capitalize border-bottom pb-2 mb-4">{name}</h2>
      {plats.length === 0 ? (
        <p className="text-muted">Aucun plat disponible dans cette catégorie.</p>
      ) : (
        <div className="row">
          {plats.map((plat) => (
            <Plat key={plat.id} plat={plat} />
          ))}
        </div>
      )}
    </section>
  );
}
