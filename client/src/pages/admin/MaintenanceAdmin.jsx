import React, { useEffect, useState, useMemo } from 'react';
import SimpleModal from '../../components/SimpleModal';

export default function AdminMaintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [toast, setToast] = useState(null);

  // filters / pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/maintenance', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Failed to load records'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Filtering and pagination
  const filtered = useMemo(() => {
    let arr = records.slice();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(r => (r.equipment||'').toLowerCase().includes(q) || (r.tagnumber||'').toLowerCase().includes(q) || (r.department||'').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      arr = arr.filter(r => {
        const s = r.repair_status || (r.returned ? 'Returned' : r.sent_to_ict ? 'Sent to ICT' : 'Pending');
        return s === statusFilter;
      });
    }
    if (departmentFilter !== 'all') {
      arr = arr.filter(r => (r.department||'') === departmentFilter);
    }
    return arr;
  }, [records, search, statusFilter, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize);

  // Toast helper
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Actions
  const openDetails = (rec) => { setDetailRecord(rec); setDetailOpen(true); };

  const openConfirm = (action, rec) => { setConfirmAction(action); setConfirmTarget(rec); setConfirmOpen(true); };

  const performConfirm = async () => {
    if (!confirmAction || !confirmTarget) { setConfirmOpen(false); return; }
    try {
      if (confirmAction === 'send') {
        const res = await fetch(`/api/maintenance/${confirmTarget.id}/send-to-ict`, { method: 'POST', credentials: 'include' });
        if (!res.ok) throw new Error('Failed');
        showToast('Record sent to ICT');
      } else if (confirmAction === 'mark-returned') {
        // show small inline form for status
        const status = document.getElementById('returned-status-input')?.value || 'Returned';
        const res = await fetch(`/api/maintenance/${confirmTarget.id}/mark-returned`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repair_status: status }) });
        if (!res.ok) throw new Error('Failed');
        showToast('Record marked returned');
      }
      await load();
    } catch (e) {
      showToast('Operation failed');
    } finally {
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Maintenance Records</h2>
          <p className="text-sm text-gray-500">Department maintenance history and device repairs</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search equipment, tag or dept" className="px-3 py-2 border rounded-md text-sm" />
        </div>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-2 py-1 border rounded">
          <option value="all">All status</option>
          <option value="Pending">Pending</option>
          <option value="Sent to ICT">Sent to ICT</option>
          <option value="Returned">Returned</option>
        </select>
        <select value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }} className="px-2 py-1 border rounded">
          <option value="all">All departments</option>
          {[...new Set(records.map(r => r.department).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repair Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.date || r.start_date || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-900"><button className="text-blue-600 hover:underline" onClick={() => openDetails(r)}>{r.equipment}</button></td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.tagnumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.repair_status || (r.returned ? 'Returned' : r.sent_to_ict ? 'Sent to ICT' : 'Pending')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {isAdmin ? (
                          <>
                            <button onClick={() => openConfirm('send', r)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Send to ICT</button>
                            <button onClick={() => openConfirm('mark-returned', r)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Mark Returned</button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {filtered.length} records</div>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded">Prev</button>
              <div className="px-2">{page} / {totalPages}</div>
              <button disabled={page>=totalPages} onClick={() => setPage(p=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <SimpleModal open={detailOpen} title={`Maintenance #${detailRecord?.id || ''}`} onClose={() => setDetailOpen(false)}>
        {detailRecord ? (
          <div className="space-y-2">
            <div><strong>Date:</strong> {detailRecord.date || detailRecord.start_date}</div>
            <div><strong>Equipment:</strong> {detailRecord.equipment}</div>
            <div><strong>Tag:</strong> {detailRecord.tagnumber}</div>
            <div><strong>Department:</strong> {detailRecord.department}</div>
            <div><strong>Notes:</strong><pre className="text-sm bg-gray-50 p-2 rounded">{detailRecord.repair_notes || ''}</pre></div>
            <div><strong>Inventory link:</strong> {detailRecord.inventory_id ? <a className="text-blue-600" href={`/inventory/${detailRecord.inventory_id}`}>Item #{detailRecord.inventory_id}</a> : '—'}</div>
          </div>
        ) : null}
      </SimpleModal>

      {/* Confirm modal */}
      <SimpleModal open={confirmOpen} title={confirmAction === 'send' ? 'Send to ICT' : 'Confirm action'} onClose={() => setConfirmOpen(false)}>
        {confirmAction === 'mark-returned' ? (
          <div className="space-y-3">
            <div>Mark record <strong>#{confirmTarget?.id}</strong> as returned.</div>
            <label className="block text-sm">Repair status</label>
            <input id="returned-status-input" defaultValue="Returned" className="w-full px-2 py-1 border rounded" />
            <div className="flex justify-end gap-2"><button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="px-3 py-1 bg-green-600 text-white rounded" onClick={performConfirm}>Confirm</button></div>
          </div>
        ) : (
          <div>
            <p>Are you sure you want to send maintenance record <strong>#{confirmTarget?.id}</strong> to ICT?</p>
            <div className="flex justify-end gap-2 mt-4"><button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={performConfirm}>Confirm</button></div>
          </div>
        )}
      </SimpleModal>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow">{toast}</div>
      )}
    </div>
  );
}
