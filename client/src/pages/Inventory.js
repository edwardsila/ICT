

import React, { useState } from 'react';

const Inventory = () => {
  const [form, setForm] = useState({
    item_name: '',
    item_type: '',
    service_tag: '',
    status: 'In',
    received_date: '',
    received_by: '',
    sent_for_repair_date: '',
    returned_date: '',
    repair_status: 'Repaired',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMessage('Item added successfully!');
        setForm({
          item_name: '', item_type: '', service_tag: '', status: 'In', received_date: '', received_by: '', sent_for_repair_date: '', returned_date: '', repair_status: 'Repaired', notes: ''
        });
      } else {
        setMessage('Failed to add item.');
      }
    } catch {
      setMessage('Error connecting to server.');
    }
  };
  return (
    <div className="container py-5">
      <h2 className="mb-4">Inventory</h2>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Inventory Item</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" name="item_name" value={form.item_name} onChange={handleChange} placeholder="e.g. Cisco Phone" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Item Type</label>
                <input type="text" className="form-control" name="item_type" value={form.item_type} onChange={handleChange} placeholder="e.g. Router, Monitor" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Service Tag</label>
                <input type="text" className="form-control" name="service_tag" value={form.service_tag} onChange={handleChange} placeholder="e.g. SVC12345" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange} required>
                  <option>In</option>
                  <option>Out</option>
                  <option>Repair</option>
                </select>
              </div>
              {/* Dynamic fields based on status */}
              {form.status === 'In' && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Received Date</label>
                    <input type="date" className="form-control" name="received_date" value={form.received_date} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Who Received It</label>
                    <input type="text" className="form-control" name="received_by" value={form.received_by} onChange={handleChange} placeholder="e.g. John Doe" required />
                  </div>
                </>
              )}
              {form.status === 'Repair' && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Sent for Repair Date</label>
                    <input type="date" className="form-control" name="sent_for_repair_date" value={form.sent_for_repair_date} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Returned Date</label>
                    <input type="date" className="form-control" name="returned_date" value={form.returned_date} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Repair Status</label>
                    <select className="form-select" name="repair_status" value={form.repair_status} onChange={handleChange} required>
                      <option>Repaired</option>
                      <option>Not Repaired</option>
                      <option>Sent Back</option>
                    </select>
                  </div>
                </>
              )}
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Additional notes"></textarea>
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
