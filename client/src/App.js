
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


// Placeholder page components
const Home = () => (
  <section className="hero-section d-flex align-items-center justify-content-center text-center">
    <div className="container">
      <div className="hero-content">
        <h1 className="display-1 fw-bold text-gradient mb-4 animate__animated animate__fadeInDown">ICT Inventory & Maintenance System</h1>
        <p className="lead fs-3 mb-4 animate__animated animate__fadeInUp animate__delay-1s">Track, manage, and report on all your ICT assets and maintenance activities with ease.</p>
        <div className="d-flex justify-content-center gap-3 animate__animated animate__fadeInUp animate__delay-2s">
          <Link to="/inventory" className="btn btn-lg btn-primary shadow">Get Started</Link>
          <Link to="/reports" className="btn btn-lg btn-outline-light shadow">Learn More</Link>
        </div>
      </div>
      {/* Moving Parts: Animated Icons */}
      <div className="mt-5 d-flex justify-content-center gap-4 animate__animated animate__fadeIn animate__delay-3s">
        <span className="hero-icon"><i className="bi bi-hdd-network fs-1 text-primary"></i></span>
        <span className="hero-icon"><i className="bi bi-tools fs-1 text-warning"></i></span>
        <span className="hero-icon"><i className="bi bi-building fs-1 text-info"></i></span>
        <span className="hero-icon"><i className="bi bi-bar-chart-line fs-1 text-success"></i></span>
      </div>
    </div>
  </section>
);

function App() {
  return (
    <Router>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div className="container-fluid">
          <div className="d-flex w-100 align-items-center">
            {/* Brand left */}
            <Link className="navbar-brand fw-bold fs-2 me-3" to="/">ICT Inventory</Link>
            {/* Centered nav links */}
            <div className="flex-grow-1 d-flex justify-content-center">
              <ul className="navbar-nav">
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
            {/* Admin/Login/Register dropdown right using React-Bootstrap */}
            <Dropdown className="ms-auto">
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
        <Route path="/" element={<Home />} />
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
          <span>&copy; {new Date().getFullYear()} ICT Inventory & Maintenance System. All rights reserved.</span>
        </div>
      </footer>
    </Router>
  );
}

export default App;
