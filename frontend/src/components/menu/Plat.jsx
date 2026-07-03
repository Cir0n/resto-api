export default function Plat({ plat }) {
  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card plat-card shadow-sm">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start">
            <h5 className="card-title mb-1">{plat.name}</h5>
            <span className="badge bg-primary rounded-pill">
              {Number(plat.price).toFixed(2)} €
            </span>
          </div>
          {plat.description && (
            <p className="card-text text-muted small mt-2">{plat.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
