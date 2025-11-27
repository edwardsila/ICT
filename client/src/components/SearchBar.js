import React, { useEffect, useRef, useState } from 'react';

// Modern SearchBar with debounce and suggestion dropdown
export default function SearchBar({ placeholder = 'Search...', onSelect, value, onQueryChange }) {
  // If `value` is provided, the component operates in controlled mode for the input.
  const [internalQuery, setInternalQuery] = useState('');
  const query = typeof value === 'string' ? value : internalQuery;
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [cachedInventory, setCachedInventory] = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewDetails, setPreviewDetails] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    // debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // First, try a server-side search endpoint
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data.slice(0, 8));
            setLoading(false);
            setOpen(true);
            return;
          }
        }

        // Fallback: fetch full inventory once and filter client-side
        // Use cachedInventory to avoid repeated fetches during the session
        let items = cachedInventory;
        if (!items) {
          try {
            const invRes = await fetch('/api/inventory', { credentials: 'include' });
            if (invRes.ok) {
              items = await invRes.json();
              setCachedInventory(items);
            } else {
              items = [];
            }
          } catch (err) {
            items = [];
          }
        }

        // Simple case-insensitive substring filter across common fields
        const q = query.trim().toLowerCase();
        const filtered = (items || []).filter(it => {
          try {
            const hay = `${it.asset_no || ''} ${it.asset_type || ''} ${it.serial_no || ''} ${it.manufacturer || ''} ${it.model || ''}`.toLowerCase();
            return hay.includes(q);
          } catch (e) { return false; }
        }).slice(0, 8).map(it => ({ id: it.id, title: `${it.asset_no} — ${it.asset_type}`, subtitle: `${it.manufacturer || ''} ${it.model || ''} ${it.serial_no || ''}`.trim(), type: 'inventory' }));

        setSuggestions(filtered);
      } catch (err) {
        setSuggestions([]);
      }
      setLoading(false);
      setOpen(true);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selected >= 0 && suggestions[selected]) {
        chooseSuggestion(suggestions[selected]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function chooseSuggestion(item) {
    // If caller provided onSelect, call it
    if (onSelect) {
      try { onSelect(item); } catch (e) { /* ignore */ }
      // close suggestions after select
      setOpen(false);
      setSuggestions([]);
      setSelected(-1);
      return;
    }
    // Otherwise open an inline preview (modern slide-over) for the selected inventory item
    if (item?.id) {
      setPreviewItem(item);
      setPreviewOpen(true);
      // close suggestions when opening preview
      setOpen(false);
      setSuggestions([]);
      setSelected(-1);
    }
  }

  // fetch preview details when previewItem changes
  useEffect(() => {
    if (!previewItem || !previewItem.id) {
      setPreviewDetails(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/inventory/${encodeURIComponent(previewItem.id)}`, { credentials: 'include' });
        if (!res.ok) {
          setPreviewDetails(null);
        } else {
          const d = await res.json(); if (!cancelled) setPreviewDetails(d);
        }
      } catch (e) { if (!cancelled) setPreviewDetails(null); }
      if (!cancelled) setPreviewLoading(false);
    })();
    return () => { cancelled = true; };
  }, [previewItem]);

  return (
    <div className="search-bar position-relative" style={{maxWidth: 760, width: '100%'}}>
      <div className="input-group">
        <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
        <input
          ref={inputRef}
          type="search"
          className="form-control border-start-0"
          placeholder={placeholder}
          value={query}
          aria-label="Search"
          onChange={e => {
            const v = e.target.value;
            if (typeof onQueryChange === 'function') onQueryChange(v);
            if (typeof value !== 'string') setInternalQuery(v);
            setSelected(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
        />
        {query && (
          <button className="btn btn-outline-secondary" onClick={() => {
            // Clear input (support controlled/uncontrolled modes)
            if (typeof onQueryChange === 'function') onQueryChange('');
            if (typeof value !== 'string') setInternalQuery('');
            setSuggestions([]);
            setOpen(false);
            inputRef.current?.focus();
          }} aria-label="Clear search">Clear</button>
        )}
      </div>

      {open && (
        <div style={{position: 'absolute', left: 0, right: 0, marginTop: 6, zIndex: 9999}}>
          <div className="card shadow" style={{overflow: 'hidden'}}>
            <ul className="list-group list-group-flush" role="listbox">
            {loading && (
              <li className="list-group-item small text-muted">Searching...</li>
            )}
            {!loading && suggestions.length === 0 && (
              <li className="list-group-item small text-muted">No results</li>
            )}
            {!loading && suggestions.map((s, idx) => (
              <li
                key={s.id || `${s.title}-${idx}`}
                role="option"
                aria-selected={selected === idx}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${selected === idx ? 'active' : ''}`}
                onMouseDown={e => { e.preventDefault(); chooseSuggestion(s); }}
                onMouseEnter={() => setSelected(idx)}
              >
                <div>
                  <div className="fw-semibold">{s.title || s.name || s.username}</div>
                  {s.subtitle && <div className="small text-muted">{s.subtitle}</div>}
                </div>
                {s.type && <span className="badge bg-light text-dark ms-2">{s.type}</span>}
              </li>
            ))}
            </ul>
          </div>
        </div>
      )}

      {/* Inline preview slide-over when no onSelect provided */}
      {previewOpen && previewItem && (
        <div style={{position: 'fixed', top: 0, right: 0, height: '100vh', width: 420, zIndex: 10000}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)'}} onClick={() => { setPreviewOpen(false); setPreviewItem(null); setPreviewDetails(null); }} />
          <div className="bg-white shadow-lg h-full overflow-auto" style={{width: 420, right: 0, position: 'relative'}}>
            <div className="p-4 border-b d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Item Preview</h5>
              <button className="btn btn-sm" onClick={() => { setPreviewOpen(false); setPreviewItem(null); setPreviewDetails(null); }}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="p-3">
              {previewLoading ? (
                <div className="text-muted">Loading...</div>
              ) : previewDetails ? (
                <div>
                  <div className="fw-bold mb-1">{previewDetails.asset_no} — {previewDetails.asset_type}</div>
                  <div className="small text-muted mb-2">{previewDetails.manufacturer || ''} {previewDetails.model || ''} {previewDetails.serial_no ? `• SN: ${previewDetails.serial_no}` : ''}</div>
                  <div className="mb-2">Department: <strong>{previewDetails.department}</strong></div>
                  <div className="mb-2">Status: <span className="badge bg-secondary">{previewDetails.status}</span></div>
                  <div className="mb-3"><div className="small text-muted">OS / Info</div><div>{previewDetails.os_info || '—'}</div></div>
                  <div className="d-flex gap-2">
                    <a className="btn btn-sm btn-primary" href={`/inventory?itemId=${previewDetails.id}`}>Open</a>
                    <a className="btn btn-sm btn-outline-secondary" href={`/inventory?edit=${previewDetails.id}`}>Edit</a>
                    <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                      // quick delete from preview (confirm)
                      if (!window.confirm('Delete this item?')) return;
                      try {
                        const r = await fetch(`/api/inventory/${previewDetails.id}`, { method: 'DELETE', credentials: 'include' });
                        if (r.ok) { alert('Deleted'); window.location.reload(); } else { const d = await r.json().catch(()=>({})); alert(d.error||'Delete failed'); }
                      } catch (e) { alert('Delete failed'); }
                    }}>Delete</button>
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
  );
}
