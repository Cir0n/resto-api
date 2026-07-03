import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active fw-semibold' : ''}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          Le Bistrot
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className={linkClass} to="/menu">
                Menu
              </NavLink>
            </li>
            {isAuthenticated && !isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/my-reservations">
                    Mes réservations
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/reservations/new">
                    Réserver
                  </NavLink>
                </li>
              </>
            )}
            {isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Administration
                </a>
                <ul className="dropdown-menu dropdown-menu-dark">
                  <li>
                    <NavLink className="dropdown-item" to="/reservations">
                      Réservations
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/admin/menu">
                      Menu
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/admin/holidays">
                      Jours fériés
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}
          </ul>
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <li className="nav-item">
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Déconnexion
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/login">
                    Connexion
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/signup">
                    Inscription
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
