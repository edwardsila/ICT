import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useUser } from '../context/UserContext';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ inventory_id: '', from_department: '', to_department: '', transfer_type: '', destination: '', notes: '', repaired_status: 'not_repaired', repaired_by: '', repair_comments: '', date_received: '', date_sent: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [replacementInventoryId, setReplacementInventoryId] = useState(null);
  const [replacementDetails, setReplacementDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const { currentUser } = useUser();

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
    const user = currentUser || {};
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
    const user = currentUser || {};
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><i className="bi bi-arrow-left"></i> Back</Link>
        <h2 className="text-2xl font-semibold">Transfers</h2>
        <div />
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium">Create Transfer</h4>
          <div className="text-sm text-gray-500">Create branch or internal transfers</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
          <select name="transfer_type" value={form.transfer_type} onChange={e => { setForm(f => ({ ...f, transfer_type: e.target.value })); setMessage(''); }} className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Choose transfer type --</option>
            <option value="branch">Branch (incoming to ICT)</option>
            <option value="internal">Internal (replacement)</option>
          </select>
        </div>

        {/* Branch transfer form */}
        {form.transfer_type === 'branch' && (
          <form onSubmit={handleSend}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inventory Item (search)</label>
                <SearchBar placeholder="Search item being received..." onSelect={handleSelectInventory} />
                {form.inventory_id && <div className="text-sm text-gray-500 mt-1">Selected ID: {form.inventory_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Repaired Status</label>
                <select name="repaired_status" value={form.repaired_status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2">
                  <option value="repaired">Repaired</option>
                  <option value="not_repaired">Not Repaired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Who Repaired</label>
                <input name="repaired_by" value={form.repaired_by} onChange={handleChange} placeholder="Technician name" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Received</label>
                <input type="datetime-local" name="date_received" value={form.date_received} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Sent</label>
                <input type="datetime-local" name="date_sent" value={form.date_sent} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Repair Comments</label>
                <textarea rows="3" name="repair_comments" value={form.repair_comments} onChange={handleChange} placeholder="Notes about repair or inspection" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Where Sent To (after ICT)</label>
                <div className="flex gap-2 mt-1">
                  <select name="to_department" value={form.to_department || ''} onChange={handleChange} className="flex-1 rounded-md border-gray-300 px-3 py-2">
                    <option value="">-- Select department (optional) --</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="text" name="destination" value={form.destination} onChange={handleChange} placeholder="Freeform destination (optional)" className="flex-1 rounded-md border-gray-300 px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">From Department</label>
                <select name="from_department" value={form.from_department || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2">
                  <option value="">-- Select origin department --</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" disabled={loading}>{loading ? 'Sending...' : 'Record Branch Transfer'}</button>
            </div>
          </form>
        )}

        {/* Internal replacement form */}
        {form.transfer_type === 'internal' && (
          <form onSubmit={handleSend}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Item being replaced (search)</label>
                <SearchBar placeholder="Search faulty item..." onSelect={handleSelectInventory} />
                {form.inventory_id && <div className="text-sm text-gray-500 mt-1">Selected faulty ID: {form.inventory_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Received</label>
                <input type="datetime-local" name="date_received" value={form.date_received} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Received By</label>
                <input name="received_by" value={form.received_by || ''} onChange={handleChange} placeholder="Technician or ICT staff" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Issue Comments</label>
                <textarea rows="3" name="issue_comments" value={form.issue_comments || ''} onChange={handleChange} placeholder="Describe reported issues" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department to return replacement to</label>
                <select name="to_department" value={form.to_department || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2">
                  <option value="">-- Select department --</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Replacement item (optional - choose existing)</label>
                <SearchBar placeholder="Search replacement item (optional)" onSelect={item => { if (item && item.id) setReplacementInventoryId(item.id); }} />
                {replacementInventoryId && <div className="text-sm text-gray-500 mt-1">Selected replacement ID: {replacementInventoryId}</div>}
              </div>

              <div className="md:col-span-2">
                <button type="button" className="inline-flex items-center gap-2 mt-2 px-3 py-2 border rounded-md text-sm" onClick={() => {
                  const asset_type = window.prompt('Replacement asset type (e.g. Laptop):', 'Laptop');
                  if (!asset_type) return;
                  const serial_no = window.prompt('Replacement serial number (optional):', '');
                  const manufacturer = window.prompt('Replacement manufacturer (optional):', '');
                  const model = window.prompt('Replacement model (optional):', '');
                  const status = window.prompt('Replacement status (Active/Stored):', 'Active');
                  setReplacementDetails({ asset_type, serial_no, manufacturer, model, status });
                }}>Create New Replacement</button>
                {replacementDetails && <div className="text-sm text-gray-500 mt-2">Will create replacement: {replacementDetails.asset_type} {replacementDetails.model || ''}</div>}
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md" disabled={loading}>{loading ? 'Processing...' : 'Create Internal Replacement'}</button>
            </div>
          </form>
        )}

          {message && <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded">{message}</div>}

        {/* Recent transfers list */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Recent Transfers</h3>
          {(!transfers || transfers.length === 0) ? (
            <div className="text-sm text-gray-500">No transfers yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transfers.map(t => (
                <div key={t.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{t.asset_no || t.inventory_id || 'Item ' + t.inventory_id}</div>
                      <div className="text-sm text-gray-500">{t.asset_type || ''} — {t.item_department || t.from_department}</div>
                      <div className="text-xs text-gray-400 mt-1">Sent at: {t.sent_at}</div>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${t.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' : t.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{t.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button className="px-2 py-1 bg-green-600 text-white rounded text-sm" onClick={() => handleReceiveIct(t.id)}>Receive ICT</button>
                    <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => handleShip(t.id)}>Ship</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={() => handleAcknowledge(t.id)}>Acknowledge</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={() => handleRecordsReceive(t.id)}>Mark Records Received</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={() => handleCompleteReplacement(t.id)}>Complete Replacement</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfers;
