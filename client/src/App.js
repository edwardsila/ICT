import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { Dropdown } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Inventory from './pages/Inventory';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Transfers from './pages/Transfers';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import Settings from './pages/Settings';
import SearchBar from './components/SearchBar';

// Wrapper for Reports page to show message for non-admins
function ReportsMessageWrapper() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    currentUser = null;
  }
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">You must be an admin to view reports.</div>
      </div>
    );
  }
  return <Reports />;
}


// Auth utility
function isLoggedIn() {
  return !!localStorage.getItem('user');
}

function ProtectedRoute({ element, adminOnly }) {
  const navigate = useNavigate();
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch {}
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { replace: true });
    } else if (adminOnly && currentUser?.role !== 'admin') {
      navigate('/');
    }
  }, [navigate, adminOnly]);
  if (!isLoggedIn()) return null;
  if (adminOnly && currentUser?.role !== 'admin') return null;
  return element;
}


// MWALIMU National Sacco logo
const mwalimuLogo = 'https://imgs.search.brave.com/f1dIw44rlZWslko55CbuopR9Ai9WhBhPKxWq2NsaqEU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS90aGRkZ1FCc0RD/dTRhTi1qX0V4a1VV/ZVRKNTRyOFBsaTI2/a3FqTU5mT29YYm9V/cXZQREtIX3hjdkZw/bEVyaXV4U2hyMz13/MjQwLWg0ODAtcnc';



function ModernHome() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-md-8 text-center">
          <img src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '120px', maxWidth: '320px', marginBottom: '24px', borderRadius: '24px', boxShadow: '0 4px 24px rgba(31,38,135,0.25)', background: '#fff', padding: '12px'}} />
          <h1 className="fw-bold mb-2" style={{color: '#1b5e20'}}>MNSS ICT Portal</h1>
          <p className="lead" style={{color: '#333'}}>Welcome to the MWALIMU NATIONAL SACCO ICT SYSTEM. Manage inventory, maintenance, and reports with ease.</p>
          {/* Modern search placed here on the Home screen */}
          <div className="mt-4 d-flex justify-content-center">
            <SearchBar placeholder="Search inventory, users, or reports..." />
          </div>
        </div>
      </div>
      <div className="row g-4 justify-content-center">
        <div className="col-md-4">
          <div className="card shadow h-100 text-center">
            <div className="card-body">
              <i className="bi bi-box-seam display-4 text-success mb-3"></i>
              <h4 className="mb-2">Inventory</h4>
              <p>Add all ICT equipment and assets.</p>
              <Link to="/inventory" className="btn btn-success w-100">Add Inventory</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow h-100 text-center">
            <div className="card-body">
              <i className="bi bi-tools display-4 text-warning mb-3"></i>
              <h4 className="mb-2">Maintenance</h4>
              <p>Log and review maintenance activities by floor.</p>
              <Link to="/maintenance" className="btn btn-warning w-100">Go to Maintenance</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow h-100 text-center">
            <div className="card-body">
              <i className="bi bi-bar-chart-line display-4 text-info mb-3"></i>
              <h4 className="mb-2">Reports</h4>
              <p>Generate and view reports for ICT operations.</p>
              <Link to="/reports" className="btn btn-info w-100">Go to Reports</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow h-100 text-center">
            <div className="card-body">
              <i className="bi bi-arrow-left-right display-4 text-secondary mb-3"></i>
              <h4 className="mb-2">Transfers</h4>
              <p>Send inventory items to other departments and track acknowledgments.</p>
              <Link to="/transfers" className="btn btn-secondary w-100">Go to Transfers</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Get current user
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch {}

  // Logout handler
  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return (
    <Router>
      <div className="app-flex-layout d-flex flex-column min-vh-100">
        {/* Navigation Bar */}
        <nav className="navbar navbar-expand-md navbar-dark mwalimu-navbar shadow">
          <div className="container-fluid d-flex align-items-center">
            {/* Brand left with logo */}
            <Link className="navbar-brand d-flex align-items-center me-3" to="/">
              <img src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '40px', marginRight: '10px', borderRadius: '8px', background: 'rgba(27,94,32,0.9)', padding: '4px', border: '2px solid #fbc02d'}} />
              <span className="fw-bold fs-2" style={{color: '#fbc02d'}}>MWALIMU ICT</span>
            </Link>
            {/* Spacer to push nav links right */}
            <div className="flex-grow-1"></div>
            {/* Responsive navbar toggler */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            {/* Navbar links and account dropdown right aligned */}
            <div className="collapse navbar-collapse justify-content-end" id="mainNavbar">
              <ul className="navbar-nav gap-2">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/inventory">Inventory</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/maintenance">Maintenance</Link>
                </li>
                {/* Transfers link removed - accessible from Home page */}
                <li className="nav-item">
                  <Link className="nav-link" to="/reports">Reports</Link>
                </li>
                {currentUser?.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link fw-bold text-warning" to="/admin"><i className="bi bi-speedometer2"></i> Dashboard</Link>
                  </li>
                )}
              </ul>
              {/* Account dropdown menu */}
              {isLoggedIn() ? (
                <div className="d-flex align-items-center gap-2 ms-3">
                  <span className="text-light fw-bold"><i className="bi bi-person-circle me-1"></i>{currentUser?.username}</span>
                  <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <Dropdown className="ms-3">
                  <Dropdown.Toggle variant="outline-light" id="dropdown-user">
                    Account
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item as={Link} to="/admin">Admin</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/login">Login</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/register">Register</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ModernHome />} />
            <Route path="/inventory" element={<ProtectedRoute element={<Inventory />} />} />
            <Route path="/maintenance" element={<ProtectedRoute element={<Maintenance />} />} />
            <Route path="/reports" element={<ProtectedRoute element={<ReportsMessageWrapper />} adminOnly={true} />} />
            <Route path="/admin" element={<ProtectedRoute element={<Admin />} adminOnly={true} />} />
            <Route path="/transfers" element={<ProtectedRoute element={<Transfers />} />} />
            <Route path="/users" element={<ProtectedRoute element={<Users />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-dark text-light py-4 mt-auto">
          <div className="container text-center">
            <span>&copy; {new Date().getFullYear()} MWALIMU Towers ICT System. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
