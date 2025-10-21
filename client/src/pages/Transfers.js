import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Transfers = () => {
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ inventory_id: '', to_department: '', destination: '', notes: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const DEPARTMENTS = ['Records', 'ICT', 'Finance', 'HR', 'Procurement', 'Transport', 'Security', 'Registry', 'General'];

  useEffect(() => {
    fetchInventory();
    fetchTransfers();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error(err);
    }
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

  const handleSend = async e => {
    e.preventDefault();
    setMessage('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const payload = { ...form, from_department: 'ICT', sent_by: user?.username || 'Unknown' };
    try {
      setLoading(true);
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage('Transfer logged successfully.');
        setForm({ inventory_id: '', to_department: '', notes: '' });
        fetchTransfers();
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to create transfer.');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
    setLoading(false);
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
          <h4 className="mb-3">Send Inventory to Department</h4>
          <form onSubmit={handleSend}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Inventory Item</label>
                <select className="form-select" name="inventory_id" value={form.inventory_id} onChange={handleChange} required>
                  <option value="">-- Select Item --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.asset_no} - {item.asset_type} ({item.department})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Destination Department</label>
                <select className="form-select" name="to_department" value={form.to_department} onChange={handleChange} required>
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Destination (e.g. Mombasa, Kapenguria)</label>
                <input type="text" className="form-control" name="destination" value={form.destination} onChange={handleChange} placeholder="Destination location" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Notes (optional)</label>
                <input type="text" className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Any notes for the transfer" />
              </div>
            </div>
            <button type="submit" className="btn btn-success mt-3" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <h4 className="mb-3">Transfer History</h4>
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asset</th>
                  <th>Destination</th>
                <th>From</th>
                <th>To</th>
                <th>Sent By</th>
                <th>Sent At</th>
                <th>Status</th>
                <th>Received By</th>
                <th>Received At</th>
                  <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.asset_no ? `${t.asset_no} (${t.asset_type})` : t.inventory_id}</td>
                  <td>{t.destination || ''}</td>
                  <td>{t.from_department}</td>
                  <td>{t.to_department}</td>
                  <td>{t.sent_by}</td>
                  <td>{new Date(t.sent_at).toLocaleString()}</td>
                  <td>{t.status}</td>
                  <td>{t.received_by}</td>
                  <td>{t.received_at ? new Date(t.received_at).toLocaleString() : ''}</td>
                  <td>{t.tracking_info}</td>
                  <td>
                    {t.status !== 'ReceivedByRecords' && t.to_department === 'Records' && (
                      <button className="btn btn-sm btn-success me-1" onClick={() => handleRecordsReceive(t.id)}>Receive at Records</button>
                    )}
                    {t.status === 'ReceivedByRecords' && (
                      <button className="btn btn-sm btn-warning me-1" onClick={() => handleShip(t.id)}>Mark as Shipped</button>
                    )}
                    {t.status !== 'Delivered' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAcknowledge(t.id)}>Acknowledge Destination</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
