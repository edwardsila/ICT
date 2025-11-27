import React, { useEffect, useState } from 'react';

export default function AdminMaintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const doConfirm = (msg) => window.confirm(msg);

  const sendToIct = async (id) => {
    if (!doConfirm('Mark this maintenance record as sent to ICT?')) return;
    try {
      const res = await fetch(`/api/maintenance/${id}/send-to-ict`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Failed to update'); }
  };

  const doPrompt = (msg, def = '') => window.prompt(msg, def);

  const markReturned = async (id) => {
    const status = doPrompt('Optional repair status (e.g. Repaired):', 'Returned');
    if (status === null) return;
    try {
      const res = await fetch(`/api/maintenance/${id}/mark-returned`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repair_status: status }) });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Failed to mark returned'); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Maintenance Records</h2>
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
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.date || r.start_date || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{r.equipment}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.tagnumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.repair_status || (r.returned ? 'Returned' : r.sent_to_ict ? 'Sent to ICT' : 'Pending')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => sendToIct(r.id)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Send to ICT</button>
                        <button onClick={() => markReturned(r.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Mark Returned</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
