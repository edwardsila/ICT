
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [type, setType] = useState('inventory');
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const r = await fetch('/api/departments', { credentials: 'include' });
      if (!r.ok) return;
      const j = await r.json(); setDepartments(Array.isArray(j) ? j.map(x => x.name) : []);
    } catch (e) { }
  };

  const load = async () => {
    setLoading(true); setMessage('');
    try {
      let url = '/api/inventory';
      if (type === 'maintenance') url = '/api/maintenance';
      if (type === 'transfers') url = '/api/transfers';
      if (type === 'inventory' && department) url += `?department=${encodeURIComponent(department)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { const e = await res.json().catch(()=>({})); setMessage(e.error || 'Failed to load'); setData([]); setLoading(false); return; }
      let d = await res.json(); d = Array.isArray(d) ? d : [];
      // date filtering for maintenance/transfers
      if ((type === 'maintenance' || type === 'transfers') && (fromDate || toDate)) {
        const from = fromDate ? new Date(fromDate) : null; const to = toDate ? new Date(toDate) : null;
        d = d.filter(r => {
          const tval = r.date || r.sent_at || r.received_at || r.sent_to_ict_at || r.returned_at || r.records_received_at || null;
          if (!tval) return true;
          const t = new Date(tval);
          if (from && t < from) return false;
          if (to && t > to) return false;
          return true;
        });
      }
      setData(d);
    } catch (err) { setMessage('Error loading report'); setData([]); }
    setLoading(false);
  };

  const downloadPdf = () => {
    const title = `Report - ${type}`;
    const rowsHtml = buildHtmlRows();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f3f4f6}</style></head><body><h1>${title}</h1><div>Generated: ${new Date().toLocaleString()}</div>${rowsHtml}</body></html>`;
    const win = window.open('', '_blank'); if (!win) { alert('Allow popups to download PDF'); return; }
    win.document.write(html); win.document.close(); setTimeout(()=>win.print(), 400);
  };

  const escapeHtml = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const buildHtmlRows = () => {
    if (!data || data.length === 0) return '<div>No data</div>';
    if (type === 'inventory') {
      const rows = data.map(d => `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.asset_no)}</td>
        <td>${escapeHtml(d.asset_type)}</td>
        <td>${escapeHtml(d.serial_no||'')}</td>
        <td>${escapeHtml(d.manufacturer||'')}</td>
        <td>${escapeHtml(d.model||'')}</td>
        <td>${escapeHtml(d.version||'')}</td>
        <td>${escapeHtml(d.os_info||'')}</td>
        <td>${escapeHtml(d.department||'')}</td>
        <td>${escapeHtml(d.status||'')}</td>
        <td>${escapeHtml(d.received_at||'')}</td>
        <td>${escapeHtml(String(d.replacement_of||''))}</td>
        <td>${escapeHtml(String(d.replaced_by||''))}</td>
      </tr>`).join('');
      return `<table><thead><tr><th>ID</th><th>Asset No</th><th>Type</th><th>Serial</th><th>Manufacturer</th><th>Model</th><th>Version</th><th>OS</th><th>Department</th><th>Status</th><th>Received At</th><th>Replacement Of</th><th>Replaced By</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (type === 'maintenance') {
      const rows = data.map(d => `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.date||'')}</td>
        <td>${escapeHtml(d.tagnumber||'')}</td>
        <td>${escapeHtml(d.equipment||'')}</td>
        <td>${escapeHtml(d.equipment_model||'')}</td>
        <td>${escapeHtml(d.department||'')}</td>
        <td>${escapeHtml(d.user||'')}</td>
        <td>${escapeHtml(String(d.inventory_id||''))}</td>
        <td>${escapeHtml(d.inventory_asset_no||'')}</td>
        <td>${escapeHtml(d.inventory_asset_type||'')}</td>
        <td>${escapeHtml(d.inventory_serial_no||'')}</td>
        <td>${escapeHtml(d.repair_status||'')}</td>
        <td>${escapeHtml(d.repair_notes||'')}</td>
        <td>${escapeHtml(String(d.sent_to_ict||'') )}</td>
        <td>${escapeHtml(d.sent_to_ict_at||'')}</td>
        <td>${escapeHtml(String(d.returned||''))}</td>
        <td>${escapeHtml(d.returned_at||'')}</td>
        <td>${escapeHtml(d.start_date||'')}</td>
        <td>${escapeHtml(d.end_date||'')}</td>
        <td>${escapeHtml(String(d.progress||''))}</td>
        <td>${escapeHtml(String(d.machines_not_maintained||''))}</td>
        <td>${escapeHtml(d.dept_status||'')}</td>
      </tr>`).join('');
      return `<table><thead><tr><th>ID</th><th>Date</th><th>Tag</th><th>Equipment</th><th>Equipment Model</th><th>Department</th><th>User</th><th>Inventory ID</th><th>Inv Asset No</th><th>Inv Type</th><th>Inv Serial</th><th>Repair Status</th><th>Repair Notes</th><th>Sent To ICT</th><th>Sent At</th><th>Returned</th><th>Returned At</th><th>Start Date</th><th>End Date</th><th>Progress</th><th>Machines Not Maintained</th><th>Dept Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (type === 'transfers') {
      const rows = data.map(d => `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(String(d.inventory_id||''))}</td>
        <td>${escapeHtml(d.asset_no||d.item_serial_no||'')}</td>
        <td>${escapeHtml(d.item_serial_no||'')}</td>
        <td>${escapeHtml(d.from_department||'')}</td>
        <td>${escapeHtml(d.to_department||d.destination||'')}</td>
        <td>${escapeHtml(d.transfer_type||'')}</td>
        <td>${escapeHtml(d.sent_by||'')}</td>
        <td>${escapeHtml(d.sent_at||'')}</td>
        <td>${escapeHtml(d.shipped_by||'')}</td>
        <td>${escapeHtml(d.shipped_at||'')}</td>
        <td>${escapeHtml(d.tracking_info||'')}</td>
        <td>${escapeHtml(d.status||'')}</td>
        <td>${escapeHtml(d.notes||'')}</td>
        <td>${escapeHtml(d.date_received||'')}</td>
        <td>${escapeHtml(d.date_sent||'')}</td>
        <td>${escapeHtml(d.repaired_status||'')}</td>
        <td>${escapeHtml(d.repaired_by||'')}</td>
        <td>${escapeHtml(d.repair_comments||'')}</td>
        <td>${escapeHtml(d.records_received_by||'')}</td>
        <td>${escapeHtml(d.records_received_at||'')}</td>
        <td>${escapeHtml(d.records_notes||'')}</td>
        <td>${escapeHtml(d.destination_received_by||'')}</td>
        <td>${escapeHtml(d.destination_received_at||'')}</td>
        <td>${escapeHtml(d.received_by||'')}</td>
        <td>${escapeHtml(d.issue_comments||'')}</td>
        <td>${escapeHtml(String(d.replacement_inventory_id||''))}</td>
      </tr>`).join('');
      return `<table><thead><tr><th>ID</th><th>Inventory ID</th><th>Inv Asset No</th><th>Inv Serial</th><th>From</th><th>To</th><th>Transfer Type</th><th>Sent By</th><th>Sent At</th><th>Shipped By</th><th>Shipped At</th><th>Tracking</th><th>Status</th><th>Notes</th><th>Date Received</th><th>Date Sent</th><th>Repaired Status</th><th>Repaired By</th><th>Repair Comments</th><th>Records Received By</th><th>Records Received At</th><th>Records Notes</th><th>Destination Received By</th><th>Destination Received At</th><th>Received By</th><th>Issue Comments</th><th>Replacement Inventory ID</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    return '<div>Unsupported</div>';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Generate inventory, maintenance and transfer reports. Use filters and download as PDF.</p>
        </div>
        <div>
          <Link to="/admin" className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50">Back to Admin</Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-700">Report Type</label>
            <select className="mt-1 block w-full rounded border p-2" value={type} onChange={e => setType(e.target.value)}>
              <option value="inventory">Inventory</option>
              <option value="maintenance">Maintenance</option>
              <option value="transfers">Transfers</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Department</label>
            <select className="mt-1 block w-full rounded border p-2" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">From</label>
            <input type="date" className="mt-1 block w-full rounded border p-2" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">To</label>
            <input type="date" className="mt-1 block w-full rounded border p-2" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded">Generate</button>
          <button onClick={downloadPdf} className="px-4 py-2 bg-gray-800 text-white rounded">Download PDF</button>
        </div>

        {message && <div className="text-red-600 mb-3">{message}</div>}

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : data.length === 0 ? (
              <div className="text-gray-500">No records to show.</div>
            ) : (
              <div className="space-y-3">
                {type === 'inventory' && (
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Asset No</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Serial</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(d => (
                        <tr key={d.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{d.id}</td>
                          <td className="px-3 py-2 text-sm">{d.asset_no}</td>
                          <td className="px-3 py-2 text-sm">{d.asset_type}</td>
                          <td className="px-3 py-2 text-sm">{d.serial_no}</td>
                          <td className="px-3 py-2 text-sm">{d.department}</td>
                          <td className="px-3 py-2 text-sm">{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {type === 'maintenance' && (
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Tag</th>
                        <th className="px-3 py-2">Equipment</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(d => (
                        <tr key={d.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{d.id}</td>
                          <td className="px-3 py-2 text-sm">{d.tagnumber}</td>
                          <td className="px-3 py-2 text-sm">{d.equipment}</td>
                          <td className="px-3 py-2 text-sm">{d.department}</td>
                          <td className="px-3 py-2 text-sm">{d.user}</td>
                          <td className="px-3 py-2 text-sm">{d.repair_status}</td>
                          <td className="px-3 py-2 text-sm">{d.sent_to_ict_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {type === 'transfers' && (
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Inventory ID</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(d => (
                        <tr key={d.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{d.id}</td>
                          <td className="px-3 py-2 text-sm">{d.inventory_id}</td>
                          <td className="px-3 py-2 text-sm">{d.from_department}</td>
                          <td className="px-3 py-2 text-sm">{d.to_department || d.destination}</td>
                          <td className="px-3 py-2 text-sm">{d.status}</td>
                          <td className="px-3 py-2 text-sm">{d.sent_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
