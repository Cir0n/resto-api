export default function Spinner({ label = 'Chargement…' }) {
  return (
    <div className="spinner-overlay">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
      <span className="ms-3 text-muted">{label}</span>
    </div>
  );
}
