import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

const Inventory = () => {
  // Inventory page only needs the add form; department selection stays in the form state
  const [form, setForm] = useState({
    asset_no: '',
    asset_type: '',
    serial_no: '',
    manufacturer: '',
    model: '',
    version: '',
    os_info: '',
    status: 'Active',
    department: 'UNASSIGNED'
  });
  const [message, setMessage] = useState('');
  const [DEPARTMENTS, setDEPARTMENTS] = useState([]);
  // listing state (Tailwind card grid)
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // recentItems moved to Admin dashboard

  useEffect(() => {
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
    // If a serial query param is present (navigated from Maintenance -> Add device), prefill it
    try {
      const params = new URLSearchParams(window.location.search);
      const serial = params.get('serial');
      if (serial) setForm(f => ({ ...f, serial_no: serial }));
    } catch (e) {
      // ignore if URLSearchParams not available
    }
  }, []);

  // Load items and departments for listing
  useEffect(() => {
    loadItems();
    loadDepartmentsList();
  }, []);

  async function loadItems() {
    setLoadingItems(true); setItemsError('');
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItemsError(e.message || 'Failed to load');
    }
    setLoadingItems(false);
  }

  async function loadDepartmentsList() {
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setDepartmentsList(Array.isArray(d) ? d.map(x => x.name) : []);
      }
    } catch (e) {}
  }

  function filteredItems() {
    let arr = items.slice();
    if (deptFilter !== 'all') arr = arr.filter(i => (i.department||'') === deptFilter);
    if (statusFilter !== 'all') arr = arr.filter(i => (i.status||'') === statusFilter);
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(i => (`${i.asset_no||''} ${i.asset_type||''} ${i.serial_no||''} ${i.manufacturer||''} ${i.model||''}`).toLowerCase().includes(q));
    }
    return arr;
  }

  async function openPreview(id) {
    setPreviewOpen(true); setPreviewLoading(true); setPreviewItem(null);
    try {
      const res = await fetch(`/api/inventory/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json(); setPreviewItem(d);
      } else {
        setPreviewItem(null);
      }
    } catch (e) { setPreviewItem(null); }
    setPreviewLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { await loadItems(); setPreviewOpen(false); } else { const d = await res.json().catch(()=>({})); alert(d.error||'Delete failed'); }
    } catch (e) { alert('Delete failed'); }
  }

  function downloadCsv() {
    const rows = filteredItems();
    if (!rows.length) return alert('No items to export');
    const header = ['id','asset_no','asset_type','serial_no','manufacturer','model','status','department','received_at'];
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory_export.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // recent-items UI and logic moved to Admin.js

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const payload = { ...form, department: form.department || 'UNASSIGNED' };
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) {
        const created = await res.json();
        setMessage('Item added successfully!');
  setForm({ asset_no: '', asset_type: '', serial_no: '', manufacturer: '', model: '', version: '', os_info: '', status: 'Active', department: payload.department || 'UNASSIGNED' });
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to add item');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-sm text-gray-700"><i className="bi bi-arrow-left"></i> Back</Link>
      </div>

      {/* Add Inventory Form (primary focus) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Inventory Item</h2>
          <div className="text-sm text-gray-500">Quickly add new inventory to the system</div>
        </div>

        {message && <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                {[...new Set(['UNASSIGNED', ...DEPARTMENTS])].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Choose department; leave as UNASSIGNED if unknown.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Asset No</label>
              <input type="text" name="asset_no" value={form.asset_no} readOnly disabled placeholder="Auto-generated by server" className="mt-1 block w-full bg-gray-50 rounded-md border-gray-200 text-sm px-3 py-2" />
              <p className="mt-1 text-xs text-gray-400">Generated when the item is created.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Type</label>
              <input type="text" name="asset_type" value={form.asset_type} onChange={handleChange} placeholder="e.g. Laptop" required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Serial No</label>
              <input type="text" name="serial_no" value={form.serial_no} onChange={handleChange} placeholder="e.g. SN123456" required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <input type="text" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="e.g. Dell" required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Latitude 5400" required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Model Year</label>
              <input type="text" name="version" value={form.version} onChange={handleChange} placeholder="e.g. 2023" required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Operating System</label>
              <input type="text" name="os_info" value={form.os_info} onChange={handleChange} placeholder="e.g. Windows 11" className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={form.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2">
              <option>Active</option>
              <option>Inactive</option>
              <option>Repair</option>
              <option>Disposed</option>
            </select>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700">Add Item</button>
          </div>
        </form>
      </div>

      {/*
        Listing & preview UI commented out for now — keeping code here for later.
        To restore: remove surrounding block comment. The listing provides search, filters,
        card grid, CSV export and preview slide-over.
      */}
      {
        /*
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">All Items</h3>
            <div className="flex items-center gap-2">
              <button onClick={downloadCsv} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Export CSV</button>
            </div>
          </div>

          <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Search inventory..." value={query} onQueryChange={v => setQuery(v)} onSelect={item => { if (item?.id) openPreview(item.id); }} />
            </div>
            <div className="mt-3 md:mt-0 flex items-center gap-3">
              <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option value="all">All departments</option>
                {departmentsList.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option value="all">All status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Repair">Repair</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
          </div>

          {loadingItems ? (
            <div className="text-gray-600">Loading inventory...</div>
          ) : itemsError ? (
            <div className="text-red-600">{itemsError}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems().map(item => (
                <div key={item.id} className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{item.asset_no || item.asset_type}</div>
                      <div className="text-sm text-gray-500">{item.manufacturer || ''} {item.model || ''}</div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded ${item.status === 'Active' ? 'bg-green-100 text-green-800' : item.status === 'Repair' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{item.status || '—'}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">Dept: <strong className="text-gray-800">{item.department || 'UNASSIGNED'}</strong></div>
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => openPreview(item.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">View</button>
                    <Link to={`/inventory?edit=${item.id}`} className="px-2 py-1 border rounded text-sm">Edit</Link>
                    <Link to={`/transfers?itemId=${item.id}`} className="px-2 py-1 border rounded text-sm">Transfer</Link>
                    <button onClick={() => handleDelete(item.id)} className="ml-auto px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {previewOpen && (
            <div style={{position: 'fixed', top:0, right:0, height:'100vh', width:420, zIndex:10000}}>
              <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)'}} onClick={() => { setPreviewOpen(false); setPreviewItem(null); }} />
              <div className="bg-white shadow-lg h-full overflow-auto" style={{width:420, right:0, position:'relative'}}>
                <div className="p-4 border-b flex items-center justify-between">
                  <h5 className="mb-0">Item Preview</h5>
                  <button className="btn btn-sm" onClick={() => { setPreviewOpen(false); setPreviewItem(null); }}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="p-3">
                  {previewLoading ? (
                    <div className="text-muted">Loading...</div>
                  ) : previewItem ? (
                    <div>
                      <div className="font-bold mb-1">{previewItem.asset_no} — {previewItem.asset_type}</div>
                      <div className="text-sm text-gray-500 mb-2">{previewItem.manufacturer || ''} {previewItem.model || ''} {previewItem.serial_no ? `• SN: ${previewItem.serial_no}` : ''}</div>
                      <div className="mb-2">Department: <strong>{previewItem.department}</strong></div>
                      <div className="mb-2">Status: <span className="px-2 py-1 bg-gray-100 rounded">{previewItem.status}</span></div>
                      <div className="mb-3"><div className="text-sm text-gray-500">OS / Info</div><div>{previewItem.os_info || '—'}</div></div>
                      <div className="flex gap-2">
                        <a className="px-3 py-1 bg-blue-600 text-white rounded" href={`/inventory?itemId=${previewItem.id}`}>Open</a>
                        <a className="px-3 py-1 border rounded" href={`/inventory?edit=${previewItem.id}`}>Edit</a>
                        <button className="px-3 py-1 border rounded" onClick={() => handleDelete(previewItem.id)}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">No details</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        */}

    </div>
  );
};

export default Inventory;
