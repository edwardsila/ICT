import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage('Login successful!');
        // Store user info (simple localStorage for now)
        localStorage.setItem('user', JSON.stringify(data));
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
          // Show the server error inline instead of forcing a reload so
          // the user sees the real reason (invalid credentials, etc.)
          setMessage(data.error || 'Invalid credentials');
          return;
        }
        setMessage(data.error || 'Login failed.');
      }
    } catch {
      setMessage('Error connecting to server.');
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{minHeight: '80vh'}}>
      <div className="glass-card p-4" style={{maxWidth: 400, width: '100%'}}>
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill display-3 text-success mb-2"></i>
          <h2 className="fw-bold mb-1" style={{color: '#1b5e20'}}>Login</h2>
          <p className="text-muted">Welcome back to MWALIMU ICT</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent"><i className="bi bi-person"></i></span>
              <input type="text" className="form-control" id="username" name="username" value={form.username} onChange={handleChange} placeholder="Enter username" required />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent"><i className="bi bi-key"></i></span>
              <input type="password" className="form-control" id="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" required />
            </div>
          </div>
          <button type="submit" className="btn btn-success w-100 fw-bold">Login</button>
          <div className="text-center mt-3">
            <button type="button" className="btn btn-link text-success p-0">Forgot password?</button>
          </div>
          {message && (
            <div className={`alert mt-3 ${success ? 'alert-success' : 'alert-danger'}`}>{message}</div>
          )}
        </form>
        <div className="text-center mt-3">
          <span>Don't have an account? </span>
          <Link to="/register" className="btn btn-link text-primary p-0">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
