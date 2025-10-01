
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';


function App() {
  return (
    <>
      {/* Navigation Bar */}
  <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div className="container">
          <a className="navbar-brand fw-bold fs-2" href="#">ICT Inventory</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link active" href="#">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Inventory</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Maintenance</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Reports</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Login</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center justify-content-center text-center">
        <div className="container">
          <div className="hero-content">
            <h1 className="display-1 fw-bold text-gradient mb-4 animate__animated animate__fadeInDown">ICT Inventory & Maintenance System</h1>
            <p className="lead fs-3 mb-4 animate__animated animate__fadeInUp animate__delay-1s">Track, manage, and report on all your ICT assets and maintenance activities with ease.</p>
            <div className="d-flex justify-content-center gap-3 animate__animated animate__fadeInUp animate__delay-2s">
              <a href="#" className="btn btn-lg btn-primary shadow">Get Started</a>
              <a href="#" className="btn btn-lg btn-outline-light shadow">Learn More</a>
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

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container text-center">
          <span>&copy; {new Date().getFullYear()} ICT Inventory & Maintenance System. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}

export default App;
