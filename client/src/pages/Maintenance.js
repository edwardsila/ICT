
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  const [form, setForm] = useState({
    date: '',
    equipment: '',
    tagnumber: '',
    department: '',
    equipment_model: '',
    user: ''
  });
  const [inventory_id, setInventoryId] = useState(null);
  const [repair_notes, setRepairNotes] = useState('');
  const [DEPARTMENTS, setDEPARTMENTS] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [message, setMessage] = useState('');
  React.useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch('/api/departments', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setDEPARTMENTS(data.map(d => d.name));
        }
      } catch (err) {
        // ignore
      }
    }
    loadDepts();
  }, []);
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleDeptSelect = async (dept) => {
    setForm({ ...form, department: dept, inventory_id: null });
    // fetch inventory for department
    try {
      const res = await fetch(`/api/inventory?department=${encodeURIComponent(dept)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInventoryList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setInventoryList([]);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { ...form, inventory_id: form.inventory_id || null, repair_notes: form.repair_notes || '' };
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) {
        setMessage('Record added successfully!');
        setForm({ date: '', equipment: '', tagnumber: '', department: '', equipment_model: '', user: '', inventory_id: null, repair_notes: '' });
      } else {
        const errorData = await res.json();
        setMessage(errorData.error ? `Failed to add record: ${errorData.error}` : 'Failed to add record.');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };
  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Home</Link>
      </div>
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
                <div className="d-flex gap-2 flex-wrap">
                  {DEPARTMENTS.map(d => (
                    <button key={d} type="button" className={`btn btn-${form.department === d ? 'primary' : 'outline-primary'}`} onClick={() => handleDeptSelect(d)}>{d}</button>
                  ))}
                </div>
                <div className="form-text">Select department to load inventory items below.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Equipment Model</label>
                <input type="text" className="form-control" name="equipment_model" value={form.equipment_model} onChange={handleChange} placeholder="e.g. Dell Latitude 5400" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Link Inventory Item (optional)</label>
                <select className="form-select" name="inventory_id" value={form.inventory_id || ''} onChange={handleChange}>
                  <option value="">-- New / Not in Inventory --</option>
                  {inventoryList.map(it => (
                    <option key={it.id} value={it.id}>{it.asset_no} — {it.model || it.asset_type}</option>
                  ))}
                </select>
                <div className="form-text">Choose an existing inventory item for this maintenance record, if applicable.</div>
              </div>
              <div className="col-md-12">
                <label className="form-label">Repair Notes (optional)</label>
                <textarea className="form-control" name="repair_notes" value={form.repair_notes} onChange={handleChange} rows={3} />
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
