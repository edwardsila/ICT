import React, { useEffect, useState, useMemo } from 'react';
import SimpleModal from '../../components/SimpleModal';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Failed to load inventory'); }
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const r = await fetch('/api/departments', { credentials: 'include' });
      if (!r.ok) return setDepartments([]);
      const d = await r.json();
      setDepartments(Array.isArray(d) ? d.map(x => x.name) : []);
    } catch (e) { setDepartments([]); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { loadDepartments(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const openEdit = (item) => { setEditTarget(item); setEditOpen(true); };
  const openAssign = (item) => { setAssignTarget(item); setAssignOpen(true); };
  const openDelete = (item) => { setConfirmTarget(item); setConfirmOpen(true); };

  const performDelete = async () => {
    if (!confirmTarget) return;
    try {
      const res = await fetch(`/api/inventory/${confirmTarget.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to delete');
      } else {
        showToast('Deleted');
        await load();
      }
    } catch (e) { showToast('Failed to delete'); }
    setConfirmOpen(false); setConfirmTarget(null);
  };

  const performAssign = async (newDept) => {
    if (!assignTarget) return;
    try {
      const body = { department: newDept };
      const res = await fetch(`/api/inventory/${assignTarget.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...assignTarget, department: newDept }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to assign');
      } else {
        showToast('Assigned');
        await load();
        setAssignOpen(false); setAssignTarget(null);
      }
    } catch (e) { showToast('Failed to assign'); }
  };

  const performEditSave = async (updated) => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/inventory/${editTarget.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to save');
      } else {
        showToast('Saved');
        await load();
        setEditOpen(false); setEditTarget(null);
      }
    } catch (e) { showToast('Failed to save'); }
  };

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => {
      return (String(it.asset_no || '').toLowerCase().includes(q)) || (String(it.serial_no || '').toLowerCase().includes(q)) || (String(it.manufacturer || '').toLowerCase().includes(q)) || (String(it.model || '').toLowerCase().includes(q)) || (String(it.asset_type || '').toLowerCase().includes(q));
    });
  }, [items, search]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500">Search and manage inventory items</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset no, serial, model..." className="px-3 py-2 border rounded-md text-sm" />
          <button onClick={() => load()} className="px-3 py-2 bg-white border rounded text-sm">Refresh</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-700">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(it => (
                  <tr key={it.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{it.asset_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.asset_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.serial_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.status}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(it)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Edit</button>
                        <button onClick={() => openAssign(it)} className="px-2 py-1 border border-gray-300 rounded text-sm">Assign</button>
                        <button onClick={() => openDelete(it)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow">{toast}</div>}

      <SimpleModal open={confirmOpen} title="Delete inventory" onClose={() => setConfirmOpen(false)}>
        <div>
          <p>Delete item <strong>{confirmTarget?.asset_no}</strong> (ID {confirmTarget?.id})?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={performDelete}>Delete</button>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal open={assignOpen} title="Assign department" onClose={() => { setAssignOpen(false); setAssignTarget(null); }}>
        <AssignForm target={assignTarget} departments={departments} onCancel={() => { setAssignOpen(false); setAssignTarget(null); }} onSave={(dept) => performAssign(dept)} />
      </SimpleModal>

      <SimpleModal open={editOpen} title="Edit inventory" onClose={() => { setEditOpen(false); setEditTarget(null); }}>
        <EditForm target={editTarget} onCancel={() => { setEditOpen(false); setEditTarget(null); }} onSave={(u) => performEditSave(u)} />
      </SimpleModal>
    </div>
  );
}

function AssignForm({ target, departments = [], onCancel, onSave }) {
  const [dept, setDept] = useState(target?.department || 'UNASSIGNED');
  useEffect(() => { setDept(target?.department || 'UNASSIGNED'); }, [target]);
  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm text-gray-700">Item</label>
        <div className="text-sm font-medium">{target?.asset_no} — {target?.model}</div>
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-700">Department</label>
        <select value={dept} onChange={e => setDept(e.target.value)} className="mt-1 block w-full border rounded p-2">
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
        <button onClick={() => onSave(dept)} className="px-3 py-1 bg-blue-600 text-white rounded">Assign</button>
      </div>
    </div>
  );
}

function EditForm({ target, onCancel, onSave }) {
  const [form, setForm] = useState(null);
  useEffect(() => { if (target) setForm({ asset_no: target.asset_no || '', asset_type: target.asset_type || '', serial_no: target.serial_no || '', manufacturer: target.manufacturer || '', model: target.model || '', version: target.version || '', os_info: target.os_info || '', status: target.status || '' }); }, [target]);
  if (!form) return <div>Loading...</div>;
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-700">Asset No</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.asset_no} onChange={e => setForm({ ...form, asset_no: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Type</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Serial</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.serial_no} onChange={e => setForm({ ...form, serial_no: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Manufacturer</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Model</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Version</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-700">OS Info</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.os_info} onChange={e => setForm({ ...form, os_info: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-700">Status</label>
          <input className="mt-1 block w-full border rounded p-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
        <button onClick={() => onSave(form)} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  );
}
