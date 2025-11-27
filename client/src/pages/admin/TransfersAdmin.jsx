import React, { useEffect, useState } from 'react';

export default function AdminTransfers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/transfers', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Failed to load transfers'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doConfirm = (msg) => window.confirm(msg);

  const receiveIct = async (id) => {
    if (!doConfirm('Mark this transfer as received by ICT?')) return;
    try {
      const res = await fetch(`/api/transfers/${id}/receive-ict`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Failed to update'); }
  };

  const ship = async (id) => {
    if (!doConfirm('Mark this transfer as shipped?')) return;
    try {
      const res = await fetch(`/api/transfers/${id}/ship`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Failed to ship'); }
  };

  const doPrompt = (msg, def = '') => window.prompt(msg, def);

  const acknowledge = async (id) => {
    const who = doPrompt('Received by (name):');
    if (!who) return;
    try {
      const res = await fetch(`/api/transfers/${id}/acknowledge`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ received_by: who }) });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Failed to acknowledge'); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Transfers</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{t.asset_no || t.item_serial_no || t.inventory_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.from_department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.to_department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.sent_at}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => receiveIct(t.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Receive ICT</button>
                        <button onClick={() => ship(t.id)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Ship</button>
                        <button onClick={() => acknowledge(t.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Acknowledge</button>
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
