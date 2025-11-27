
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import InventoryPreview from '../components/InventoryPreview';

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
    // Department maintenance fields (simplified per request)
    start_date: '',
    end_date: '',
    department: '',
    repair_notes: '',
    machines_not_maintained: 0
  });
  // device-level form will use `form.inventory_id` and `form.repair_notes`
  const [DEPARTMENTS, setDEPARTMENTS] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [message, setMessage] = useState('');
  const [lastNotFoundTag, setLastNotFoundTag] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
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
          department: item.department || prev.department,
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
    // fetch inventory for department to show machine count
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
        // client sends the requested minimal fields for department maintenance
        start_date: deptForm.start_date || null,
        end_date: deptForm.end_date || null,
        department: deptForm.department,
        repair_notes: deptForm.repair_notes || '',
        machines_not_maintained: Number.isFinite(Number(deptForm.machines_not_maintained)) ? Number(deptForm.machines_not_maintained) : 0
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
        setDeptForm({ start_date: '', end_date: '', department: '', repair_notes: '', machines_not_maintained: 0 });
        setInventoryList([]);
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to record department maintenance');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"><i className="bi bi-arrow-left"></i> Back</Link>
          <h2 className="text-2xl font-semibold">Maintenance</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setActiveTab('department'); document.getElementById('maintenance-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded shadow">
            <i className="bi bi-gear-wide-connected"></i>
            New Department Sweep
          </button>
          <button type="button" onClick={() => { setActiveTab('device'); document.getElementById('maintenance-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded shadow-sm">
            <i className="bi bi-box-seam"></i>
            Add Device Maintenance
          </button>
        </div>
      </div>

      <div id="maintenance-form" className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Add Maintenance Record</h3>
          <div className="text-sm text-gray-500">Record device or department maintenance quickly</div>
        </div>

          <div className="mb-4">
            <div className="inline-flex rounded-md bg-gray-100 p-1">
              <button type="button" className={`${activeTab==='device' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600'} px-4 py-2 rounded`} onClick={()=>setActiveTab('device')}>Device</button>
              <button type="button" className={`${activeTab==='department' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600'} px-4 py-2 rounded`} onClick={()=>setActiveTab('department')}>Department</button>
            </div>
          </div>

          <form onSubmit={activeTab === 'device' ? handleSubmit : handleDeptSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === 'device' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="date" value={form.date} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 bg-gray-50" name="equipment" value={form.equipment} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tag Number(MNSSXXX)</label>
                    <div className="d-flex gap-2">
                      <div style={{flex: 1}}>
                        <SearchBar
                          placeholder="Search by asset no, serial, model or manufacturer..."
                          value={form.tagnumber || ''}
                          onQueryChange={v => setForm(prev => ({ ...prev, tagnumber: v }))}
                          onSelect={async (s) => {
                            if (!s || !s.id) return;
                            try {
                              const res = await fetch(`/api/inventory/${encodeURIComponent(s.id)}`, { credentials: 'include' });
                              if (res.ok) {
                                const item = await res.json();
                                setForm(prev => ({
                                  ...prev,
                                  inventory_id: item.id,
                                  equipment: item.asset_type || prev.equipment,
                                  equipment_model: item.model || prev.equipment_model,
                                  tagnumber: item.asset_no || prev.tagnumber,
                                  manufacturer: item.manufacturer || prev.manufacturer,
                                  os_info: item.os_info || prev.os_info,
                                  department: item.department || prev.department,
                                  repair_notes: prev.repair_notes
                                }));
                              }
                            } catch (err) {
                              // ignore
                            }
                          }}
                        />
                      </div>
                      <div>
                        <button type="button" className="btn btn-outline-secondary" title="Lookup tag in inventory" onClick={() => { lookupTag(form.tagnumber); }}>
                          <i className="bi bi-search"></i>
                        </button>
                      </div>
                    </div>
                    {form.inventory_id && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <span className="badge bg-success">Inventory ID: {form.inventory_id}</span>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { setPreviewId(form.inventory_id); setPreviewOpen(true); }}>Preview</button>
                      </div>
                    )}
                    <div className="form-text">Search inventory and pick an item to populate device details for maintenance. You can also type a tag and blur to lookup.</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 bg-gray-50" name="department" value={form.department || ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 bg-gray-50" name="equipment_model" value={form.equipment_model} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 bg-gray-50" name="manufacturer" value={form.manufacturer || ''} readOnly />
                    <p className="text-xs text-gray-400 mt-1">Manufacturer (read-only from inventory)</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Repair Notes (optional)</label>
                    <textarea className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="repair_notes" value={form.repair_notes} onChange={handleChange} rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User of the Equipment</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="user" value={form.user} onChange={handleChange} placeholder="e.g. John Doe" required />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date maintenance started</label>
                    <input type="date" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="start_date" value={deptForm.start_date} onChange={handleDeptFormChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date maintenance ended (optional)</label>
                    <input type="date" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="end_date" value={deptForm.end_date} onChange={handleDeptFormChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {DEPARTMENTS.map(d => (
                        <button key={d} type="button" className={`${(deptForm.department) === d ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} px-3 py-1 rounded-md shadow-sm`} onClick={() => handleDeptSelect(d)}>{d}</button>
                      ))}
                    </div>
                    {deptForm.department && (
                      <div className="mb-2 text-sm text-gray-600">
                        <strong className="text-gray-800">{inventoryList.length}</strong> machine(s) found in <span className="font-semibold">{deptForm.department}</span>.
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Select department and record the overall department maintenance details.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of machines not maintained</label>
                    <input type="number" min={0} className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="machines_not_maintained" value={deptForm.machines_not_maintained} onChange={handleDeptFormChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Comments on overall maintenance</label>
                    <textarea className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" name="repair_notes" value={deptForm.repair_notes} onChange={handleDeptFormChange} rows={3} />
                  </div>
                </>
              )}
            </div>
            <button type="submit" className="btn btn-success mt-3 w-100">Add Record</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message} {lastNotFoundTag && (<Link to={`/inventory?serial=${encodeURIComponent(lastNotFoundTag)}`} className="btn btn-link">Add device</Link>)}</div>}
        </div>
      <InventoryPreview id={previewId} open={previewOpen} onClose={() => { setPreviewOpen(false); setPreviewId(null); }} />
    </div>
  );
};

export default Maintenance;
