import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { Dropdown } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Inventory from './pages/Inventory';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import AdminLayout from './components/AdminLayout';
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


const mwalimuLogo = 'https://imgs.search.brave.com/f1dIw44rlZWslko55CbuopR9Ai9WhBhPKxWq2NsaqEU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS90aGRkZ1FCc0RD/dTRhTi1qX0V4a1VV/ZVRKNTRyOFBsaTI2/a3FqTU5mT29YYm9V/cXZQREtIX3hjdkZw/bEVyaXV4U2hyMz13/MjQwLWg0ODAtcnc';





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
    } catch (e) {}
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  function ModernHome({ currentUser }) {
  const [query, setQuery] = useState('');
    const [stats, setStats] = useState({ total: '—', in_repair: '—', pending_transfers: '—' });
    const [recent, setRecent] = useState([]);
  // We'll use window.location for navigation from the hero

    useEffect(() => {
      // Fetch recent inventory and simple stats (best-effort)
      (async () => {
        try {
          const [recentRes, invRes, transfersRes] = await Promise.allSettled([
            fetch('/api/inventory/recent?limit=6', { credentials: 'include' }),
            fetch('/api/inventory', { credentials: 'include' }),
            fetch('/api/transfers', { credentials: 'include' })
          ]);

          if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
            const r = await recentRes.value.json(); setRecent(Array.isArray(r) ? r : []);
          }
          if (invRes.status === 'fulfilled' && invRes.value.ok) {
            const inv = await invRes.value.json(); setStats(s => ({ ...s, total: Array.isArray(inv) ? inv.length : (inv?.length || '—') }));
          }
          if (transfersRes.status === 'fulfilled' && transfersRes.value.ok) {
            const t = await transfersRes.value.json();
            const pending = Array.isArray(t) ? t.filter(x => x.status !== 'Delivered' && x.status !== 'ReceivedByRecords').length : '—';
            setStats(s => ({ ...s, pending_transfers: pending }));
          }
        } catch (err) {
          // ignore, leave placeholders
        }
      })();
    }, []);

    const doNavigate = (path) => { window.location.href = path; };

    const onSelect = (item) => {
      if (!item) return;
      if (item.id) doNavigate(`/inventory?itemId=${encodeURIComponent(item.id)}`);
      else if (item.title) doNavigate(`/inventory?q=${encodeURIComponent(item.title)}`);
    };

    return (
      <div>
        <div className="hero-section py-5 position-relative">
          <div className="hero-deco">
            <svg viewBox="0 0 1200 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <g className="floating float-slow">
                <path d="M0 120 C150 10 350 10 500 120 C650 230 850 230 1200 120 L1200 240 L0 240 Z" fill="#08a27a" />
              </g>
              <g className="floating float-fast">
                <circle cx="160" cy="40" r="28" fill="#0fefc8" opacity="0.18" />
                <circle cx="980" cy="90" r="18" fill="#ffffff" opacity="0.08" />
              </g>
            </svg>
          </div>
          <div className="container hero-content text-center text-light py-5 animate-shake">
            <img className="animate-pop" src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '100px', maxWidth: '280px', marginBottom: '16px', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', background: 'rgba(255,255,255,0.95)', padding: '8px'}} />
            <h1 className="fw-bold mb-2 text-gradient animate-fade-up" style={{fontSize: '2.6rem', animationDelay: '0.08s'}}>Mwalimu National ICT</h1>
            <p className="lead mb-3 animate-fade-up" style={{maxWidth: '820px', margin: '0 auto', animationDelay: '0.12s'}}>A simple, fast system to manage your assets, maintenance and transfers. Secure, auditable and built for the MWALIMU community.</p>
            <div className="d-flex justify-content-center mt-4">
            </div>
              <div className="mt-4 d-flex justify-content-center gap-2">
                <Link to="/inventory" className="btn btn-light btn-lg stagger-pop" style={{'--delay': '0.22s'}}>Add Inventory</Link>
                <Link to="/maintenance" className="btn btn-outline-light btn-lg stagger-pop" style={{'--delay': '0.26s'}}>Maintenance</Link>
                <Link to="/transfers" className="btn btn-outline-light btn-lg stagger-pop" style={{'--delay': '0.30s'}}>Transfers</Link>
              </div>
            <div className="mt-4 text-center hero-features">
              <ul className="list-inline mb-0">
                <li className="list-inline-item mx-3 text-light"><i className="bi bi-shield-check me-2"></i>Secure audits</li>
                <li className="list-inline-item mx-3 text-light"><i className="bi bi-clock-history me-2"></i>Easy tracking</li>
                <li className="list-inline-item mx-3 text-light"><i className="bi bi-people-fill me-2"></i>Sacco-friendly policies</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container py-5">
          <div className="row mb-4 g-3">
            <div className="col-md-4">
              <div className="stat-card p-3 text-center shadow-sm rounded">
                <div className="h1 mb-0">{stats.total}</div>
                <div className="small text-muted">Total assets</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card p-3 text-center shadow-sm rounded">
                <div className="h1 mb-0">{stats.in_repair}</div>
                <div className="small text-muted">In repair</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card p-3 text-center shadow-sm rounded">
                <div className="h1 mb-0">{stats.pending_transfers}</div>
                <div className="small text-muted">Pending transfers</div>
              </div>
            </div>
          </div>

          <h4 className="mb-3">Quick access</h4>
            <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="card interactive-card shadow h-100 text-center stagger-pop" style={{'--delay': '0.34s'}}>
                <div className="card-body">
                  <i className="bi bi-box-seam display-4 text-success mb-3"></i>
                  <h4 className="mb-2">Inventory</h4>
                  <p>Add and manage ICT equipment.</p>
                  <Link to="/inventory" className="btn btn-success w-100">Manage Inventory</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card interactive-card shadow h-100 text-center stagger-pop" style={{'--delay': '0.38s'}}>
                <div className="card-body">
                  <i className="bi bi-tools display-4 text-warning mb-3"></i>
                  <h4 className="mb-2">Maintenance</h4>
                  <p>Log and review maintenance activities.</p>
                  <Link to="/maintenance" className="btn btn-warning w-100">Go to Maintenance</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card interactive-card shadow h-100 text-center stagger-pop" style={{'--delay': '0.42s'}}>
                <div className="card-body">
                  <i className="bi bi-arrow-left-right display-4 text-secondary mb-3"></i>
                  <h4 className="mb-2">Transfers</h4>
                  <p>Track and send items between departments.</p>
                  <Link to="/transfers" className="btn btn-secondary w-100">Go to Transfers</Link>
                </div>
              </div>
            </div>
          </div>

          <h4 className="mt-5 mb-3">Recent items</h4>
          <div className="row g-3">
            {recent.length === 0 && (
              <div className="col-12"><div className="text-muted">No recent items to show.</div></div>
            )}
            {recent.map((item, idx) => (
              <div className="col-md-4" key={item.id}>
                <div className="card small-card h-100 stagger" style={{'--delay': `${0.44 + idx * 0.04}s`}}>
                  <div className="card-body d-flex align-items-start">
                    <div className="me-3">
                      <i className="bi bi-hdd display-6 text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{item.asset_no || item.asset_type}</div>
                      <div className="small text-muted">{item.manufacturer || ''} {item.model || ''}</div>
                      <div className="mt-2"><Link to={`/inventory?itemId=${item.id}`} className="stretched-link">View</Link></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <Router>
      <div className="app-flex-layout d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-md navbar-dark mwalimu-navbar shadow">
          <div className="container-fluid d-flex align-items-center">
            <Link className="navbar-brand d-flex align-items-center me-3" to="/">
              <img src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '40px', marginRight: '10px', borderRadius: '8px', background: 'rgba(27,94,32,0.9)', padding: '4px', border: '2px solid #fbc02d'}} />
              <span className="fw-bold fs-2" style={{color: '#fbc02d'}}>ICT</span>
            </Link>
            <div className="flex-grow-1"></div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
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
                {currentUser?.role === 'admin' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link fw-bold text-warning" to="/admin"><i className="bi bi-speedometer2"></i> Dashboard</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/reports">Reports</Link>
                    </li>
                  </>
                )}
              </ul>
              {/* Account dropdown */}
              {isLoggedIn() ? (
                <div className="d-flex align-items-center gap-2 ms-3">
                  <span className="text-light fw-bold"><i className="bi bi-person-circle me-1"></i>{currentUser?.username}</span>
                  <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <Dropdown className="ms-3">
                  <Dropdown.Toggle variant="outline-light" id="dropdown-user">Account</Dropdown.Toggle>
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
            <Route path="/" element={<ModernHome currentUser={currentUser} />} />
            <Route path="/inventory" element={<ProtectedRoute element={<Inventory />} />} />
            <Route path="/maintenance" element={<ProtectedRoute element={<Maintenance />} />} />
            <Route path="/reports" element={<ProtectedRoute element={<ReportsMessageWrapper />} adminOnly={true} />} />
            <Route path="/admin/*" element={<ProtectedRoute element={<AdminLayout />} adminOnly={true} />} />
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
