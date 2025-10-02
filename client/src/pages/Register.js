

import React, { useState } from 'react';
import { Link } from 'react-router-dom';


const Register = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage('Registration successful! You can now log in.');
        setForm({ username: '', password: '' });
      } else {
        setMessage(data.error || 'Registration failed.');
      }
    } catch {
      setMessage('Error connecting to server.');
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{minHeight: '80vh'}}>
      <div className="glass-card p-4" style={{maxWidth: 400, width: '100%'}}>
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill display-3 text-warning mb-2"></i>
          <h2 className="fw-bold mb-1" style={{color: '#fbc02d'}}>Register</h2>
          <p className="text-muted">Create your MWALIMU Towers ICT account</p>
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
          <button type="submit" className="btn btn-warning w-100 fw-bold">Register</button>
          <div className="text-center mt-3">
            <Link to="/login" className="text-warning">Already have an account? Login</Link>
          </div>
          {message && (
            <div className={`alert mt-3 ${success ? 'alert-success' : 'alert-danger'}`}>{message}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
