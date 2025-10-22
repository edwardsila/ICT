
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('device'); // 'device' or 'department'
  const [form, setForm] = useState({
    date: '',
    equipment: '',
    tagnumber: '',
    department: '',
    equipment_model: '',
    manufacturer: '',
    os_info: '',
    user: ''
  });
  const [deptForm, setDeptForm] = useState({
    date: '',
    department: '',
    user: '',
    equipment: 'Department Sweep',
    equipment_model: '',
    repair_notes: '',
    create_for_all: false,
    inventory_ids: []
  });
  // device-level form will use `form.inventory_id` and `form.repair_notes`
  const [DEPARTMENTS, setDEPARTMENTS] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [message, setMessage] = useState('');
  const [lastNotFoundTag, setLastNotFoundTag] = useState('');
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

  // Lookup inventory by tag when user finishes entering tag number
  const lookupTag = async (tag) => {
    if (!tag || tag.trim().length === 0) return;
    try {
      const res = await fetch(`/api/inventory/by-tag?tag=${encodeURIComponent(tag.trim())}`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setMessage('Please log in to look up devices (session missing or expired).');
        return;
      }
      if (res.ok) {
        const item = await res.json();
        // populate relevant fields on device form
        setForm(prev => ({
          ...prev,
          inventory_id: item.id,
          equipment: item.asset_type || prev.equipment,
          equipment_model: item.model || prev.equipment_model,
          tagnumber: item.asset_no || prev.tagnumber,
          manufacturer: item.manufacturer || prev.manufacturer,
          os_info: item.os_info || prev.os_info,
          repair_notes: prev.repair_notes,
          // also store os/model info for helper message
        }));
        setMessage(`Found device (ID ${item.id}): ${item.manufacturer || ''} ${item.model || ''} — OS: ${item.os_info || 'unknown'}`);
      } else if (res.status === 404) {
        setMessage(`Device not found in inventory. Add it in Inventory:`);
        // store last not-found tag so UI can show a link
        setLastNotFoundTag(tag.trim());
      } else {
        const err = await res.json();
        setMessage(err.error || 'Error looking up tag');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };
  const handleDeptSelect = async (dept) => {
    // update both forms so selection works in either tab
    setForm(prev => ({ ...prev, department: dept, inventory_id: null }));
    setDeptForm(prev => ({ ...prev, department: dept }));
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
    // For device-level maintenance, require the device to exist in inventory
    if (activeTab === 'device' && !form.inventory_id) {
      setMessage('Device not found in inventory. Please add the device using the Inventory page before recording maintenance. Outside devices are not maintained.');
      return;
    }
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

  const handleDeptFormChange = e => setDeptForm({ ...deptForm, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleDeptSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        date: deptForm.date,
        department: deptForm.department,
        user: deptForm.user,
        equipment: deptForm.equipment,
        equipment_model: deptForm.equipment_model,
        repair_notes: deptForm.repair_notes,
        create_for_all: !!deptForm.create_for_all,
        inventory_ids: deptForm.create_for_all ? [] : (deptForm.inventory_ids || [])
      };
      const res = await fetch('/api/maintenance/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Department maintenance recorded (${data.created || data.id || 'ok'})`);
        setDeptForm({ date: '', department: '', user: '', equipment: 'Department Sweep', equipment_model: '', repair_notes: '', create_for_all: false, inventory_ids: [] });
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to record department maintenance');
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
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item"><button type="button" className={`nav-link ${activeTab==='device'?'active':''}`} onClick={()=>setActiveTab('device')}>Device</button></li>
            <li className="nav-item"><button type="button" className={`nav-link ${activeTab==='department'?'active':''}`} onClick={()=>setActiveTab('department')}>Department</button></li>
          </ul>

          <form onSubmit={activeTab === 'device' ? handleSubmit : handleDeptSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Equipment</label>
                {activeTab === 'device' ? (
                  <input type="text" className="form-control" name="equipment" value={form.equipment} readOnly />
                ) : (
                  <input type="text" className="form-control" name="equipment" value={form.equipment} onChange={handleChange} placeholder="e.g. Laptop, Printer" required />
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Tag Number</label>
                <div className="input-group">
                  <input type="text" className="form-control" name="tagnumber" value={form.tagnumber} onChange={handleChange} onBlur={e=>{ if (activeTab==='device') lookupTag(e.target.value); }} placeholder="e.g. SVC12345" required />
                  <button type="button" className="btn btn-outline-secondary" title="Search tag in inventory" onClick={() => { if (activeTab==='device') lookupTag(form.tagnumber); }}>
                    <i className="bi bi-search"></i>
                  </button>
                </div>
                {form.inventory_id && (
                  <div className="mt-2">
                    <span className="badge bg-success">Inventory ID: {form.inventory_id}</span>
                  </div>
                )}
                <div className="form-text">Enter tag or serial and click the search icon to load device info from inventory.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Department</label>
                {activeTab === 'device' ? (
                  <input type="text" className="form-control" name="department" value={form.department || ''} readOnly />
                ) : (
                  <>
                    <div className="d-flex gap-2 flex-wrap">
                      {DEPARTMENTS.map(d => (
                        <button key={d} type="button" className={`btn btn-${(deptForm.department) === d ? 'primary' : 'outline-primary'}`} onClick={() => handleDeptSelect(d)}>{d}</button>
                      ))}
                    </div>
                    <div className="form-text">Select department to load inventory items below.</div>
                  </>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Model</label>
                {activeTab === 'device' ? (
                  <input type="text" className="form-control" name="equipment_model" value={form.equipment_model} readOnly />
                ) : (
                  <input type="text" className="form-control" name="equipment_model" value={form.equipment_model} onChange={handleChange} placeholder="e.g. Dell Latitude 5400" required />
                )}
              </div>
              <div className="col-md-6">
                {activeTab === 'device' ? (
                  <>
                    <label className="form-label">Manufacturer</label>
                    <input type="text" className="form-control" name="manufacturer" value={form.manufacturer || ''} readOnly />
                    <div className="form-text">Manufacturer (read-only from inventory)</div>
                  </>
                ) : (
                  <>
                    <label className="form-label">Department Inventory (select multiple if needed)</label>
                    <select multiple className="form-select" value={deptForm.inventory_ids} onChange={e => {
                      const opts = Array.from(e.target.options).filter(o => o.selected).map(o => o.value);
                      setDeptForm(prev => ({ ...prev, inventory_ids: opts }));
                    }}>
                      {inventoryList.map(it => (
                        <option key={it.id} value={String(it.id)}>{it.asset_no} — {it.model || it.asset_type}</option>
                      ))}
                    </select>
                    <div className="form-text">Choose specific inventory items to include, or check "Include all" below.</div>
                  </>
                )}
              </div>
              <div className="col-md-12">
                <label className="form-label">Repair Notes (optional)</label>
                {activeTab === 'device' ? (
                  <textarea className="form-control" name="repair_notes" value={form.repair_notes} onChange={handleChange} rows={3} />
                ) : (
                  <textarea className="form-control" name="repair_notes" value={deptForm.repair_notes} onChange={handleDeptFormChange} rows={3} />
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">User of the Equipment</label>
                {activeTab === 'device' ? (
                  <input type="text" className="form-control" name="user" value={form.user} onChange={handleChange} placeholder="e.g. John Doe" required />
                ) : (
                  <input type="text" className="form-control" name="user" value={deptForm.user} onChange={handleDeptFormChange} placeholder="Technician name" required />
                )}
              </div>
              {activeTab === 'department' && (
                <div className="col-md-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="create_for_all" name="create_for_all" checked={deptForm.create_for_all} onChange={handleDeptFormChange} />
                    <label className="form-check-label" htmlFor="create_for_all">Include all inventory items in selected department</label>
                  </div>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-success mt-3 w-100">Add Record</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message} {lastNotFoundTag && (<Link to={`/inventory?serial=${encodeURIComponent(lastNotFoundTag)}`} className="btn btn-link">Add device</Link>)}</div>}
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
