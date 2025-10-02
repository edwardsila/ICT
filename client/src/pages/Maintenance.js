
import React, { useState } from 'react';

const Maintenance = () => {
  const [form, setForm] = useState({
    date: '',
    equipment: '',
    tagnumber: '',
    department: '',
    equipment_model: '',
    user: ''
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
        setForm({ date: '', equipment: '', tagnumber: '', department: '', equipment_model: '', user: '' });
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
                <label className="form-label">Date</label>
                <input type="date" className="form-control" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Equipment</label>
                <input type="text" className="form-control" name="equipment" value={form.equipment} onChange={handleChange} placeholder="e.g. Laptop, Printer" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tag Number</label>
                <input type="text" className="form-control" name="tagnumber" value={form.tagnumber} onChange={handleChange} placeholder="e.g. SVC12345" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" name="department" value={form.department} onChange={handleChange} placeholder="e.g. HR, Finance" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Equipment Model</label>
                <input type="text" className="form-control" name="equipment_model" value={form.equipment_model} onChange={handleChange} placeholder="e.g. Dell Latitude 5400" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">User of the Equipment</label>
                <input type="text" className="form-control" name="user" value={form.user} onChange={handleChange} placeholder="e.g. John Doe" required />
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
