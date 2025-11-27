import React, { useEffect, useState } from 'react';

export default function InventoryPreview({ id, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!open || !id) { setItem(null); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/inventory/${encodeURIComponent(id)}`, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json(); if (!cancelled) setItem(d);
        } else {
          if (!cancelled) setItem(null);
        }
      } catch (e) {
        if (!cancelled) setItem(null);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, open]);

  if (!open) return null;

  return (
    <div style={{position: 'fixed', top: 0, right: 0, height: '100vh', width: 420, zIndex: 10000}}>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)'}} onClick={onClose} />
      <div className="bg-white shadow-lg h-full overflow-auto" style={{width: 420, right: 0, position: 'relative'}}>
        <div className="p-4 border-b d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Item Preview</h5>
          <button className="btn btn-sm" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="p-3">
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : item ? (
            <div>
              <div className="fw-bold mb-1">{item.asset_no} — {item.asset_type}</div>
              <div className="small text-muted mb-2">{item.manufacturer || ''} {item.model || ''} {item.serial_no ? `• SN: ${item.serial_no}` : ''}</div>
              <div className="mb-2">Department: <strong>{item.department}</strong></div>
              <div className="mb-2">Status: <span className="badge bg-secondary">{item.status}</span></div>
              <div className="mb-3"><div className="small text-muted">OS / Info</div><div>{item.os_info || '—'}</div></div>
              <div className="d-flex gap-2">
                <a className="btn btn-sm btn-primary" href={`/inventory?itemId=${item.id}`}>Open</a>
                <a className="btn btn-sm btn-outline-secondary" href={`/inventory?edit=${item.id}`}>Edit</a>
              </div>
            </div>
          ) : (
            <div className="text-muted">No details</div>
          )}
        </div>
      </div>
    </div>
  );
}
