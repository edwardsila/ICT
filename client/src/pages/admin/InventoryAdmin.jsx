import React, { useEffect, useState } from 'react';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => { load(); }, []);

  const doConfirm = (msg) => window.confirm(msg);

  const remove = async (id) => {
    if (!doConfirm('Delete this inventory item?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch (e) { alert('Delete failed'); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Inventory</h2>
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
                {items.map(it => (
                  <tr key={it.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{it.asset_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.asset_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.serial_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{it.status}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => remove(it.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
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
