import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center py-5">
      <h1 className="display-5 mb-3">Bienvenue au Bistrot</h1>
      <p className="lead text-muted mb-4">
        Découvrez notre menu et réservez votre table en quelques clics.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/menu" className="btn btn-outline-primary btn-lg">
          Voir le menu
        </Link>
        <Link
          to={isAuthenticated ? '/reservations/new' : '/login'}
          className="btn btn-primary btn-lg"
        >
          Réserver une table
        </Link>
      </div>
    </div>
  );
}
