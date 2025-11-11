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
    // If caller provided onSelect, call it; otherwise navigate to inventory detail if id present
    if (onSelect) return onSelect(item);
    if (item?.id) {
      window.location.href = `/inventory?itemId=${encodeURIComponent(item.id)}`;
    }
  }

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
        <div className="suggestions card shadow mt-1">
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
      )}
    </div>
  );
}
