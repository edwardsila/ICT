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
            <div className="flex justify-center">
              <img className="animate-pop" src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{display: 'block', height: '100px', maxWidth: '280px', margin: '0 auto 16px', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', background: 'rgba(255,255,255,0.95)', padding: '8px'}} />
            </div>
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
            {/* Workflow: Add item -> Assign -> Track -> Maintain -> Retire */}
            <div className="mt-6 max-w-4xl mx-auto bg-white/30 backdrop-blur rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 overflow-x-auto">
                {[
                  { title: 'Receive', desc: 'Item arrives', icon: 'bi-box-seam' },
                  { title: 'Add', desc: 'Add to inventory', icon: 'bi-plus-circle' },
                  { title: 'Assign', desc: 'Assign to department', icon: 'bi-people' },
                  { title: 'Transfer', desc: 'Ship/receive', icon: 'bi-arrow-left-right' },
                  { title: 'Maintain', desc: 'Send to ICT', icon: 'bi-tools' },
                  { title: 'Complete', desc: 'Return or retire', icon: 'bi-check2-circle' }
                ].map((s, i) => (
                  <div key={s.title} className="flex-1 min-w-[140px] text-center p-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-white shadow flex items-center justify-center text-green-600 mb-2"><i className={`bi ${s.icon} fs-4`}></i></div>
                    <div className="font-semibold text-sm">{s.title}</div>
                    <div className="text-xs text-gray-100">{s.desc}</div>
                    {i < 5 && <div className="hidden md:block text-gray-300 mt-3">→</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="container py-5">
          <div className="row mb-4 g-3">
            <div className="col-md-4">
              <div className="p-3 text-center rounded-xl shadow-sm bg-white">
                <div className="text-3xl font-bold mb-0">{stats.total}</div>
                <div className="text-xs text-gray-500">Total assets</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 text-center rounded-xl shadow-sm bg-white">
                <div className="text-3xl font-bold mb-0">{stats.in_repair}</div>
                <div className="text-xs text-gray-500">In repair</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 text-center rounded-xl shadow-sm bg-white">
                <div className="text-3xl font-bold mb-0">{stats.pending_transfers}</div>
                <div className="text-xs text-gray-500">Pending transfers</div>
              </div>
            </div>
          </div>

          <h4 className="mb-3">Quick access</h4>
            <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="rounded-xl overflow-hidden shadow hover:shadow-lg bg-white h-100 text-center p-4">
                <div className="text-4xl text-green-600 mb-3"><i className="bi bi-box-seam"></i></div>
                <h4 className="mb-2">Inventory</h4>
                <p className="text-sm text-gray-600">Add and manage ICT equipment.</p>
                <Link to="/inventory" className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded w-full">Manage Inventory</Link>
              </div>
            </div>
            <div className="col-md-4">
              <div className="rounded-xl overflow-hidden shadow hover:shadow-lg bg-white h-100 text-center p-4">
                <div className="text-4xl text-yellow-500 mb-3"><i className="bi bi-tools"></i></div>
                <h4 className="mb-2">Maintenance</h4>
                <p className="text-sm text-gray-600">Log and review maintenance activities.</p>
                <Link to="/maintenance" className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white rounded w-full">Go to Maintenance</Link>
              </div>
            </div>
            <div className="col-md-4">
              <div className="rounded-xl overflow-hidden shadow hover:shadow-lg bg-white h-100 text-center p-4">
                <div className="text-4xl text-gray-600 mb-3"><i className="bi bi-arrow-left-right"></i></div>
                <h4 className="mb-2">Transfers</h4>
                <p className="text-sm text-gray-600">Track and send items between departments.</p>
                <Link to="/transfers" className="inline-block mt-3 px-4 py-2 bg-gray-700 text-white rounded w-full">Go to Transfers</Link>
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
                <div className="rounded-xl overflow-hidden shadow-sm bg-white h-100 stagger" style={{'--delay': `${0.44 + idx * 0.04}s`}}>
                    <div className="p-3 d-flex align-items-start">
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
        <footer className="bg-gray-900 text-gray-200 py-8 mt-auto">
          <div className="container">
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src={mwalimuLogo} alt="logo" style={{height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px'}} />
                  <div>
                    <div className="font-bold">MWALIMU ICT</div>
                    <div className="text-xs text-gray-400">Asset & maintenance management</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="font-semibold">Quick Links</div>
                <ul className="list-unstyled mt-2">
                  <li><Link to="/inventory" className="text-gray-300">Inventory</Link></li>
                  <li><Link to="/maintenance" className="text-gray-300">Maintenance</Link></li>
                  <li><Link to="/transfers" className="text-gray-300">Transfers</Link></li>
                </ul>
              </div>
              <div className="col-md-4 mb-4">
                <div className="font-semibold">Contact</div>
                <div className="text-xs text-gray-400 mt-2">support@mwalimu.local</div>
                <div className="text-xs text-gray-400">+254 700 000 000</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-4">&copy; {new Date().getFullYear()} MWALIMU Towers ICT System. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
