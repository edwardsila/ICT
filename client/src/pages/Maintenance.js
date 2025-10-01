
import React, { useState } from 'react';

const Maintenance = () => {
  const [form, setForm] = useState({
    floor: '',
    maintenance_date: '',
    details: ''
  });
  const [message, setMessage] = useState('');
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMessage('Record added successfully!');
        setForm({ floor: '', maintenance_date: '', details: '' });
      } else {
        setMessage('Failed to add record.');
      }
    } catch {
      setMessage('Error connecting to server.');
    }
  };
  return (
    <div className="container py-5">
      <h2 className="mb-4">Maintenance</h2>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Maintenance Record</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Floor</label>
                <input type="text" className="form-control" name="floor" value={form.floor} onChange={handleChange} placeholder="e.g. 2nd Floor" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Maintenance Date</label>
                <input type="date" className="form-control" name="maintenance_date" value={form.maintenance_date} onChange={handleChange} required />
              </div>
              <div className="col-12">
                <label className="form-label">Details</label>
                <textarea className="form-control" name="details" value={form.details} onChange={handleChange} rows="2" placeholder="Maintenance details" required></textarea>
              </div>
            </div>
            <button type="submit" className="btn btn-success mt-3 w-100">Add Record</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </div>
      <div className="card shadow">
        <div className="card-body">
          <p>Maintenance records will appear here. You can add, view, edit, or delete maintenance entries.</p>
          {/* TODO: Add maintenance table and CRUD actions */}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
