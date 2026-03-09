import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── helpers ─────────────────────────────────────────────────────────────────

const LABEL_COLORS = {
  HH: '#16a34a',   // green
  HL: '#22c55e',   // lighter green
  LH: '#dc2626',   // red
  LL: '#f87171',   // lighter red
  SH: '#6b7280',
  SL: '#6b7280',
};

const EVENT_COLORS = {
  BOS:   '#2563eb',   // blue
  CHoCH: '#d97706',   // amber
};

function formatTs(ts) {
  return new Date(ts * 1000).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── SVG mini-chart ───────────────────────────────────────────────────────────

function MiniChart({ candles, swingPoints, events }) {
  const W = 900, H = 300, PAD = { top: 24, right: 20, bottom: 32, left: 68 };
  if (!candles || candles.length === 0) return null;

  const prices = candles.flatMap(c => [c.high, c.low]);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const range  = maxP - minP || 1;

  const xScale = (i) =>
    PAD.left + (i / (candles.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (p) =>
    PAD.top + ((maxP - p) / range) * (H - PAD.top - PAD.bottom);

  // candlestick body width
  const bodyW = Math.max(2, Math.floor((W - PAD.left - PAD.right) / candles.length) - 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', background: '#0f172a', borderRadius: '12px' }}
    >
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const price = minP + t * range;
        const y     = yScale(price);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="#1e293b" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end"
              fontSize="10" fill="#94a3b8">
              {price.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const cx = xScale(i);
        const bull = c.close >= c.open;
        const color = bull ? '#22c55e' : '#ef4444';
        return (
          <g key={i}>
            <line x1={cx} y1={yScale(c.high)} x2={cx} y2={yScale(c.low)}
              stroke={color} strokeWidth="1" />
            <rect
              x={cx - bodyW / 2}
              y={yScale(Math.max(c.open, c.close))}
              width={bodyW}
              height={Math.max(1, Math.abs(yScale(c.open) - yScale(c.close)))}
              fill={color}
            />
          </g>
        );
      })}

      {/* Swing point dots + labels */}
      {swingPoints.map((sp, i) => {
        const cx    = xScale(sp.index);
        const cy    = yScale(sp.price);
        const color = LABEL_COLORS[sp.label] || '#94a3b8';
        const above = sp.type === 'high';
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="5" fill={color} opacity="0.9" />
            <text
              x={cx}
              y={above ? cy - 8 : cy + 16}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill={color}
            >
              {sp.label}
            </text>
          </g>
        );
      })}

      {/* BOS / CHoCH event lines */}
      {events.map((ev, i) => {
        const evCandle = candles.findIndex(c => c.ts >= ev.ts);
        if (evCandle < 0) return null;
        const cx    = xScale(evCandle);
        const cy    = yScale(ev.price);
        const color = EVENT_COLORS[ev.type] || '#fff';
        return (
          <g key={i}>
            <line x1={cx} y1={PAD.top} x2={cx} y2={H - PAD.bottom}
              stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
            <text x={cx + 4} y={cy - 4} fontSize="10" fill={color} fontWeight="bold">
              {ev.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function MarketStructure() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [interval,   setInterval_]  = useState('1h');
  const [range,      setRange]      = useState('5d');
  const intervalRef  = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(
        `/api/market-structure/gold-usd?interval=${interval}&range=${range}`,
        { credentials: 'include' }
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${r.status}`);
      }
      setData(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [interval, range]);

  // Auto-refresh every 60 s
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  // Derive display values
  const trendBadge = data
    ? data.trend === 'bullish'
      ? { label: '▲ Bullish', cls: 'bg-success' }
      : data.trend === 'bearish'
      ? { label: '▼ Bearish', cls: 'bg-danger' }
      : { label: '● Neutral', cls: 'bg-secondary' }
    : null;

  const latestSwings = data
    ? [...data.swingPoints].slice(-10).reverse()
    : [];

  const latestEvents = data
    ? [...data.events].slice(-6).reverse()
    : [];

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="fw-bold mb-0">
            <i className="bi bi-graph-up-arrow text-warning me-2"></i>
            Gold/USD Market Structure
          </h3>
          <div className="text-muted small">
            XAU/USD · ICT methodology · swing highs / lows · BOS · CHoCH
          </div>
        </div>
        {trendBadge && (
          <span className={`badge ${trendBadge.cls} fs-6 ms-auto`}>
            {trendBadge.label}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <div>
          <label className="form-label fw-semibold mb-1 small">Interval</label>
          <select
            className="form-select form-select-sm"
            value={interval}
            onChange={e => setInterval_(e.target.value)}
          >
            <option value="15m">15 min</option>
            <option value="1h">1 hour</option>
            <option value="4h">4 hours</option>
            <option value="1d">Daily</option>
          </select>
        </div>
        <div>
          <label className="form-label fw-semibold mb-1 small">Range</label>
          <select
            className="form-select form-select-sm"
            value={range}
            onChange={e => setRange(e.target.value)}
          >
            <option value="1d">1 day</option>
            <option value="5d">5 days</option>
            <option value="1mo">1 month</option>
            <option value="3mo">3 months</option>
          </select>
        </div>
        <div className="align-self-end">
          <button
            className="btn btn-sm btn-primary"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-1" />Loading…</>
              : <><i className="bi bi-arrow-clockwise me-1" />Refresh</>}
          </button>
        </div>
        {data && (
          <div className="align-self-end ms-auto text-muted small">
            {data.source === 'demo' && (
              <span className="badge bg-warning text-dark me-2">Demo data</span>
            )}
            Auto-refresh: 60 s
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Current price card */}
      {data && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small mb-1">Current Price</div>
                <div className="fw-bold" style={{ fontSize: '2rem' }}>
                  ${data.currentPrice?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className="text-muted small">XAU/USD</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small mb-1">Market Trend</div>
                <div className={`fw-bold fs-4 ${
                  data.trend === 'bullish' ? 'text-success' :
                  data.trend === 'bearish' ? 'text-danger' : 'text-secondary'
                }`}>
                  {data.trend === 'bullish' ? '▲ Bullish'
                    : data.trend === 'bearish' ? '▼ Bearish'
                    : '● Neutral'}
                </div>
                <div className="text-muted small">Structure bias</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small mb-1">Swing Points</div>
                <div className="fw-bold fs-4">{data.swingPoints.length}</div>
                <div className="text-muted small">Detected</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small mb-1">Structure Events</div>
                <div className="fw-bold fs-4">{data.events.length}</div>
                <div className="text-muted small">BOS / CHoCH</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {data && data.candles.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-2">
            <MiniChart
              candles={data.candles}
              swingPoints={data.swingPoints}
              events={data.events}
            />
          </div>
          <div className="card-footer bg-transparent border-0 d-flex flex-wrap gap-3 small">
            {[
              ['HH', 'Higher High'],
              ['HL', 'Higher Low'],
              ['LH', 'Lower High'],
              ['LL', 'Lower Low'],
            ].map(([lbl, desc]) => (
              <span key={lbl}>
                <span
                  className="badge me-1"
                  style={{ background: LABEL_COLORS[lbl] }}
                >
                  {lbl}
                </span>
                {desc}
              </span>
            ))}
            <span>
              <span className="badge me-1 bg-primary">BOS</span>
              Break of Structure
            </span>
            <span>
              <span className="badge me-1" style={{ background: EVENT_COLORS.CHoCH }}>CHoCH</span>
              Change of Character
            </span>
          </div>
        </div>
      )}

      {/* Tables side-by-side */}
      {data && (
        <div className="row g-3">
          {/* Swing points table */}
          <div className="col-md-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white fw-semibold border-0">
                Recent Swing Points
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Label</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestSwings.length === 0 && (
                      <tr><td colSpan="4" className="text-muted text-center py-3">
                        No swing points detected
                      </td></tr>
                    )}
                    {latestSwings.map((sp, i) => (
                      <tr key={i}>
                        <td>
                          <span
                            className="badge"
                            style={{ background: LABEL_COLORS[sp.label] || '#6b7280' }}
                          >
                            {sp.label}
                          </span>
                        </td>
                        <td className="text-capitalize">{sp.type}</td>
                        <td className="fw-semibold">
                          ${sp.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="text-muted small">{formatTs(sp.ts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Events table */}
          <div className="col-md-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white fw-semibold border-0">
                BOS / CHoCH Events
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Event</th>
                      <th>Direction</th>
                      <th>Price</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestEvents.length === 0 && (
                      <tr><td colSpan="4" className="text-muted text-center py-3">
                        No events detected
                      </td></tr>
                    )}
                    {latestEvents.map((ev, i) => (
                      <tr key={i}>
                        <td>
                          <span
                            className="badge"
                            style={{ background: EVENT_COLORS[ev.type] || '#6b7280' }}
                          >
                            {ev.type}
                          </span>
                        </td>
                        <td className={
                          ev.dir === 'bullish' ? 'text-success fw-semibold' : 'text-danger fw-semibold'
                        }>
                          {ev.dir === 'bullish' ? '▲ Bullish' : '▼ Bearish'}
                        </td>
                        <td className="fw-semibold">
                          ${ev.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="text-muted small">{formatTs(ev.ts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Methodology info */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h6 className="fw-bold mb-2">
            <i className="bi bi-info-circle me-1 text-primary"></i>
            ICT Market Structure Methodology
          </h6>
          <div className="row g-3 small text-muted">
            <div className="col-md-6">
              <ul className="mb-0">
                <li><strong className="text-success">HH (Higher High)</strong> — New swing high above the previous swing high; confirms bullish structure.</li>
                <li><strong className="text-success">HL (Higher Low)</strong> — New swing low above the previous swing low; bullish continuation.</li>
                <li><strong className="text-danger">LH (Lower High)</strong> — New swing high below the previous swing high; confirms bearish structure.</li>
                <li><strong className="text-danger">LL (Lower Low)</strong> — New swing low below the previous swing low; bearish continuation.</li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="mb-0">
                <li><strong className="text-primary">BOS (Break of Structure)</strong> — Price breaks a significant high/low in the direction of the current trend, confirming continuation.</li>
                <li><strong style={{ color: EVENT_COLORS.CHoCH }}>CHoCH (Change of Character)</strong> — Price breaks against the prevailing structure, signalling a potential trend reversal.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
