import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ inventory_id: '', from_department: '', to_department: '', transfer_type: '', destination: '', notes: '', repaired_status: 'not_repaired', repaired_by: '', repair_comments: '', date_received: '', date_sent: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [replacementInventoryId, setReplacementInventoryId] = useState(null);
  const [replacementDetails, setReplacementDetails] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Departments list not required for branch-first flow (kept on server side)

  useEffect(() => {
    fetchTransfers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data.map(d => d.name) : []);
      }
    } catch (err) { console.error('Failed to load departments', err); }
  };

  

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/transfers', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectInventory = (item) => {
    if (!item || !item.id) return;
    setForm(f => ({ ...f, inventory_id: item.id }));
  };

  const handleSend = async e => {
    e.preventDefault();
    setMessage('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Build payload depending on transfer type
    let payload = { transfer_type: form.transfer_type, sent_by: user?.username || 'Unknown', from_department: form.from_department || 'UNASSIGNED' };
    if (form.transfer_type === 'branch') {
      // Convert datetime-local inputs to ISO if present
      const toIso = v => { try { return v ? new Date(v).toISOString() : null; } catch { return null; } };
      payload = {
        ...payload,
        inventory_id: form.inventory_id || null,
        repaired_status: form.repaired_status,
        repaired_by: form.repaired_by || '',
        repair_comments: form.repair_comments || '',
        date_received: toIso(form.date_received) || null,
        date_sent: toIso(form.date_sent) || null,
        destination: form.destination || '',
        to_department: form.to_department || form.destination || 'UNASSIGNED',
        notes: form.notes || ''
      };
    } else if (form.transfer_type === 'internal') {
      const toIso = v => { try { return v ? new Date(v).toISOString() : null; } catch { return null; } };
      payload = {
        ...payload,
        inventory_id: form.inventory_id || null,
        date_received: toIso(form.date_received) || null,
        received_by: form.received_by || '',
        issue_comments: form.issue_comments || '',
        to_department: form.to_department || '',
        replacement_inventory_id: replacementInventoryId || null,
        replacement_details: replacementInventoryId ? null : (replacementDetails || null),
        notes: form.notes || ''
      };
    } else {
      // Fallback generic payload
      payload = { ...payload, inventory_id: form.inventory_id || null, to_department: form.to_department || '', destination: form.destination || '', notes: form.notes || '' };
    }

    try {
      setLoading(true);
      // For branch transfers: log payload to browser console and send a debug copy to the server so it prints to the server terminal/log
      if (form.transfer_type === 'branch') {
        try {
          console.log('Branch transfer payload:', payload);
        } catch (err) {
          // ignore console errors
        }
        try {
          fetch('/api/transfers/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) }).catch(() => {});
        } catch (err) {
          // ignore debug failures
        }
      }
      const res = await fetch('/api/transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage('Transfer logged successfully.');
        setForm({ inventory_id: '', from_department: '', to_department: '', transfer_type: '', destination: '', notes: '', repaired_status: 'not_repaired', repaired_by: '', repair_comments: '', date_received: '', date_sent: '' });
        fetchTransfers();
      } else {
        const err = await res.json(); setMessage(err.error || 'Failed to create transfer.');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  const handleReceiveIct = async (id) => {
    const notes = window.prompt('Notes for ICT receive (optional):', '');
    try {
      const res = await fetch(`/api/transfers/${id}/receive-ict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ records_notes: notes || '' })
      });
      if (res.ok) fetchTransfers();
      else console.error('Failed to mark received by ICT');
    } catch (err) { console.error(err); }
  };

  const handleCompleteReplacement = async (id) => {
    // Prompt for existing replacement inventory id first
    const repIdRaw = window.prompt('Enter replacement inventory ID to use (leave empty to create a new replacement):', '');
    if (repIdRaw && repIdRaw.trim().length > 0) {
      const repId = Number(repIdRaw.trim());
      if (isNaN(repId)) return alert('Invalid replacement ID');
      try {
        const res = await fetch(`/api/transfers/${id}/complete-replacement`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ replacement_inventory_id: repId })
        });
        if (res.ok) fetchTransfers(); else { const e = await res.json(); alert(e.error || 'Failed to complete replacement'); }
      } catch (err) { console.error(err); alert('Error connecting to server'); }
      return;
    }

    // Create a new replacement
    const asset_type = window.prompt('Replacement asset type (e.g. Laptop):', 'Laptop');
    if (!asset_type) return;
    const serial_no = window.prompt('Replacement serial number (optional):', '');
    const manufacturer = window.prompt('Replacement manufacturer (optional):', '');
    const model = window.prompt('Replacement model (optional):', '');
    const status = window.prompt('Replacement status (Active/Stored):', 'Active');
    const details = { asset_type, serial_no, manufacturer, model, status };
    try {
      const res = await fetch(`/api/transfers/${id}/complete-replacement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ replacement_details: details })
      });
      if (res.ok) fetchTransfers(); else { const e = await res.json(); alert(e.error || 'Failed to create replacement'); }
    } catch (err) { console.error(err); alert('Error connecting to server'); }
  };

  const handleAcknowledge = async (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`/api/transfers/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ received_by: user?.username || 'Unknown' })
      });
      if (res.ok) {
        fetchTransfers();
      } else {
        console.error('Ack failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordsReceive = async (id) => {
    const notes = window.prompt('Any notes for records receipt (optional):', '');
    try {
      const res = await fetch(`/api/transfers/${id}/receive-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ records_notes: notes || '' })
      });
      if (res.ok) fetchTransfers();
      else console.error('Failed to mark records receipt');
    } catch (err) {
      console.error(err);
    }
  };

  const handleShip = async (id) => {
    const tracking = window.prompt('Enter tracking info or shipment reference (optional):', '');
    const destination = window.prompt('Confirm destination (e.g. Mombasa):', '');
    try {
      const res = await fetch(`/api/transfers/${id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracking_info: tracking || '', destination: destination || '' })
      });
      if (res.ok) fetchTransfers();
      else console.error('Failed to mark as shipped');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Home</Link>
      </div>
      <h2 className="mb-4">Transfers</h2>

      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Create Transfer</h4>
          <div className="mb-3">
            <label className="form-label">Transfer Type</label>
            <select className="form-select" name="transfer_type" value={form.transfer_type} onChange={e => { setForm(f => ({ ...f, transfer_type: e.target.value })); setMessage(''); }}>
              <option value="">-- Choose transfer type --</option>
              <option value="branch">Branch (incoming to ICT)</option>
              <option value="internal">Internal (replacement)</option>
            </select>
          </div>

          {/* Branch transfer form */}
          {form.transfer_type === 'branch' && (
            <form onSubmit={handleSend}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Inventory Item (search)</label>
                  <SearchBar placeholder="Search item being received..." onSelect={handleSelectInventory} />
                  {form.inventory_id && <div className="small text-muted mt-1">Selected ID: {form.inventory_id}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Repaired Status</label>
                  <select className="form-select" name="repaired_status" value={form.repaired_status} onChange={handleChange}>
                    <option value="repaired">Repaired</option>
                    <option value="not_repaired">Not Repaired</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Who Repaired</label>
                  <input className="form-control" name="repaired_by" value={form.repaired_by} onChange={handleChange} placeholder="Technician name" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date Received</label>
                  <input type="datetime-local" className="form-control" name="date_received" value={form.date_received} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date Sent</label>
                  <input type="datetime-local" className="form-control" name="date_sent" value={form.date_sent} onChange={handleChange} />
                </div>

                <div className="col-12">
                  <label className="form-label">Repair Comments</label>
                  <textarea className="form-control" rows="3" name="repair_comments" value={form.repair_comments} onChange={handleChange} placeholder="Notes about repair or inspection"></textarea>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Where Sent To (after ICT)</label>
                  <div className="d-flex gap-2">
                    <select className="form-select" name="to_department" value={form.to_department || ''} onChange={handleChange}>
                      <option value="">-- Select department (optional) --</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="text" className="form-control" name="destination" value={form.destination} onChange={handleChange} placeholder="Freeform destination (optional)" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">From Department</label>
                  <select className="form-select" name="from_department" value={form.from_department || ''} onChange={handleChange}>
                    <option value="">-- Select origin department --</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

              </div>
              <button type="submit" className="btn btn-success mt-3" disabled={loading}>{loading ? 'Sending...' : 'Record Branch Transfer'}</button>
            </form>
          )}

          {/* Internal replacement form */}
          {form.transfer_type === 'internal' && (
            <form onSubmit={handleSend}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Item being replaced (search)</label>
                  <SearchBar placeholder="Search faulty item..." onSelect={handleSelectInventory} />
                  {form.inventory_id && <div className="small text-muted mt-1">Selected faulty ID: {form.inventory_id}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date Received</label>
                  <input type="datetime-local" className="form-control" name="date_received" value={form.date_received} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Received By</label>
                  <input className="form-control" name="received_by" value={form.received_by || ''} onChange={handleChange} placeholder="Technician or ICT staff" />
                </div>

                <div className="col-12">
                  <label className="form-label">Issue Comments</label>
                  <textarea className="form-control" rows="3" name="issue_comments" value={form.issue_comments || ''} onChange={handleChange} placeholder="Describe reported issues"></textarea>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Department to return replacement to</label>
                  <select className="form-select" name="to_department" value={form.to_department || ''} onChange={handleChange}>
                    <option value="">-- Select department --</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Replacement item (optional - choose existing)</label>
                  <SearchBar placeholder="Search replacement item (optional)" onSelect={item => { if (item && item.id) setReplacementInventoryId(item.id); }} />
                  {replacementInventoryId && <div className="small text-muted mt-1">Selected replacement ID: {replacementInventoryId}</div>}
                </div>

                <div className="col-12">
                  <button type="button" className="btn btn-outline-secondary me-2 mt-2" onClick={() => {
                    // Prompt to create replacement details
                    const asset_type = window.prompt('Replacement asset type (e.g. Laptop):', 'Laptop');
                    if (!asset_type) return;
                    const serial_no = window.prompt('Replacement serial number (optional):', '');
                    const manufacturer = window.prompt('Replacement manufacturer (optional):', '');
                    const model = window.prompt('Replacement model (optional):', '');
                    const status = window.prompt('Replacement status (Active/Stored):', 'Active');
                    setReplacementDetails({ asset_type, serial_no, manufacturer, model, status });
                  }}>Create New Replacement</button>
                  {replacementDetails && <div className="small text-muted mt-2">Will create replacement: {replacementDetails.asset_type} {replacementDetails.model || ''}</div>}
                </div>

              </div>
              <button type="submit" className="btn btn-primary mt-3" disabled={loading}>{loading ? 'Processing...' : 'Create Internal Replacement'}</button>
            </form>
          )}

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default Transfers;
