
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { Dropdown } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Inventory from './pages/Inventory';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';


// MWALIMU National Sacco logo
const mwalimuLogo = 'https://imgs.search.brave.com/f1dIw44rlZWslko55CbuopR9Ai9WhBhPKxWq2NsaqEU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS90aGRkZ1FCc0RD/dTRhTi1qX0V4a1VV/ZVRKNTRyOFBsaTI2/a3FqTU5mT29YYm9V/cXZQREtIX3hjdkZw/bEVyaXV4U2hyMz13/MjQwLWg0ODAtcnc';



function ModernHome() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-md-8 text-center">
          <img src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '60px', marginBottom: '16px'}} />
          <h1 className="fw-bold mb-2" style={{color: '#1b5e20'}}>MNSS ICT Portal</h1>
          <p className="lead" style={{color: '#333'}}>Welcome to the MWALIMU NATIONAL SACCO ICT system for MWALIMU Towers. Manage inventory, maintenance, and reports with ease.</p>
        </div>
      </div>
      <div className="row g-4 justify-content-center">
        <div className="col-md-4">
          <div className="card shadow h-100 text-center">
            <div className="card-body">
              <i className="bi bi-box-seam display-4 text-success mb-3"></i>
              <h4 className="mb-2">Inventory</h4>
              <p>Track and manage all ICT equipment and assets.</p>
              <Link to="/inventory" className="btn btn-success w-100">Go to Inventory</Link>
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
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark mwalimu-navbar shadow">
        <div className="container-fluid position-relative">
          {/* Brand left with logo */}
          <Link className="navbar-brand d-flex align-items-center me-3" to="/">
            <img src={mwalimuLogo} alt="Mwalimu Sacco Logo" style={{height: '40px', marginRight: '10px'}} />
            <span className="fw-bold fs-2" style={{color: '#1b5e20'}}>MWALIMU Towers ICT</span>
          </Link>
          {/* Absolutely centered nav links */}
          <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:2}}>
            <ul className="navbar-nav flex-row gap-4">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/inventory">Inventory</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/maintenance">Maintenance</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/reports">Reports</Link>
              </li>
            </ul>
          </div>
          {/* Account dropdown menu on the right */}
          <div style={{position:'absolute',right:'0',top:'50%',transform:'translateY(-50%)',zIndex:2}}>
            <Dropdown>
              <Dropdown.Toggle variant="outline-light" id="dropdown-user">
                Account
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={Link} to="/admin">Admin</Dropdown.Item>
                <Dropdown.Item as={Link} to="/login">Login</Dropdown.Item>
                <Dropdown.Item as={Link} to="/register">Register</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <Routes>
        <Route path="/" element={<ModernHome />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container text-center">
          <span>&copy; {new Date().getFullYear()} MWALIMU Towers ICT System. All rights reserved.</span>
        </div>
      </footer>
    </Router>
  );
}

export default App;
