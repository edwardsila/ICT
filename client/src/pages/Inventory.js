

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Inventory = () => {
  const [form, setForm] = useState({
    asset_no: '',
    asset_type: '',
    serial_no: '',
    manufacturer: '',
    model: '',
    version: '',
    status: 'Active'
  });
  const [message, setMessage] = useState('');
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    console.log('[Inventory Submit] Sending:', form);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      console.log('[Inventory Submit] Response status:', res.status);
      if (res.ok) {
        setMessage('Item added successfully!');
        setForm({
          asset_no: '', asset_type: '', serial_no: '', manufacturer: '', model: '', version: '', status: 'Active'
        });
      } else {
        const errorData = await res.json();
        console.error('[Inventory Submit] Error:', errorData);
        setMessage(errorData.error ? `Failed to add item: ${errorData.error}` : 'Failed to add item.');
      }
    } catch (err) {
      console.error('[Inventory Submit] Network error:', err);
      setMessage('Error connecting to server.');
    }
  };
  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Home</Link>
      </div>
      <h2 className="mb-4">Inventory</h2>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Inventory Item</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Asset No</label>
                <input type="text" className="form-control" name="asset_no" value={form.asset_no} onChange={handleChange} placeholder="e.g. 12345" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Asset Type</label>
                <input type="text" className="form-control" name="asset_type" value={form.asset_type} onChange={handleChange} placeholder="e.g. Laptop, Printer" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Serial No</label>
                <input type="text" className="form-control" name="serial_no" value={form.serial_no} onChange={handleChange} placeholder="e.g. SN123456" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Manufacturer</label>
                <input type="text" className="form-control" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="e.g. Dell" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Model</label>
                <input type="text" className="form-control" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Latitude 5400" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Version</label>
                <input type="text" className="form-control" name="version" value={form.version} onChange={handleChange} placeholder="e.g. 2023" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange} required>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Repair</option>
                  <option>Disposed</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3 w-100">Add Item</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </div>
      <div className="card shadow">
        <div className="card-body">
          <p>List of ICT items will appear here. You can add, view, edit, or delete inventory items.</p>
          {/* TODO: Add inventory table and CRUD actions */}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
