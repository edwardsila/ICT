import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
const SWING_LOOKBACK  = 3;   // candles on each side to confirm a swing
const CHART_HEIGHT    = 360;
const CANDLE_W        = 9;
const CANDLE_GAP      = 2;
const VOLUME_H        = 60;  // height of volume sub-chart

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(unix, interval) {
  if (!unix) return '—';
  const d = new Date(unix * 1000);
  if (interval === '1d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ── Market-structure algorithm ───────────────────────────────────────────────
function analyzeMarketStructure(candles, lookback) {
  const n = candles.length;
  if (n < lookback * 2 + 1) return { swings: [], labels: [], structureEvents: [], trend: 'unknown' };

  // 1. detect swing points
  const swings = [];
  for (let i = lookback; i < n - lookback; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= candles[i].high || candles[i + j].high >= candles[i].high) isHigh = false;
      if (candles[i - j].low  <= candles[i].low  || candles[i + j].low  <= candles[i].low)  isLow  = false;
    }
    if (isHigh) swings.push({ type: 'high', index: i, price: candles[i].high });
    if (isLow)  swings.push({ type: 'low',  index: i, price: candles[i].low  });
  }
  swings.sort((a, b) => a.index - b.index);

  // 2. label swings and detect BOS / CHoCH
  let lastHigh = null, lastLow = null;
  let trend = 'neutral';
  const labels = [];
  const structureEvents = [];

  for (const swing of swings) {
    if (swing.type === 'high') {
      let label = 'SH';
      if (lastHigh !== null) {
        if (swing.price > lastHigh.price) {
          label = 'HH';
          if (trend === 'bearish') {
            structureEvents.push({ type: 'CHoCH', direction: 'bullish', breakIndex: swing.index, level: lastHigh.price });
            trend = 'bullish';
          } else if (trend === 'bullish') {
            structureEvents.push({ type: 'BOS',   direction: 'bullish', breakIndex: swing.index, level: lastHigh.price });
          } else {
            trend = 'bullish';
          }
        } else {
          label = 'LH';
        }
      }
      labels.push({ ...swing, label });
      lastHigh = swing;
    } else {
      let label = 'SL';
      if (lastLow !== null) {
        if (swing.price < lastLow.price) {
          label = 'LL';
          if (trend === 'bullish') {
            structureEvents.push({ type: 'CHoCH', direction: 'bearish', breakIndex: swing.index, level: lastLow.price });
            trend = 'bearish';
          } else if (trend === 'bearish') {
            structureEvents.push({ type: 'BOS',   direction: 'bearish', breakIndex: swing.index, level: lastLow.price });
          } else {
            trend = 'bearish';
          }
        } else {
          label = 'HL';
        }
      }
      labels.push({ ...swing, label });
      lastLow = swing;
    }
  }

  return { swings, labels, structureEvents, trend };
}

// ── Chart renderer (SVG) ─────────────────────────────────────────────────────
function CandlestickChart({ candles, labels, structureEvents, interval }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const n        = candles.length;
  const totalW   = n * (CANDLE_W + CANDLE_GAP);
  const padLeft  = 70;
  const padRight = 20;
  const padTop   = 30;
  const padBot   = 30;
  const innerH   = CHART_HEIGHT - padTop - padBot;
  const svgW     = totalW + padLeft + padRight;
  const svgH     = CHART_HEIGHT + VOLUME_H + 10;

  const allHighs  = candles.map(c => c.high);
  const allLows   = candles.map(c => c.low);
  const maxPrice  = Math.max(...allHighs);
  const minPrice  = Math.min(...allLows);
  const priceRange = maxPrice - minPrice || 1;

  const toY = useCallback((p) => padTop + ((maxPrice - p) / priceRange) * innerH, [maxPrice, priceRange, innerH, padTop]);
  const toX = useCallback((i) => padLeft + i * (CANDLE_W + CANDLE_GAP) + CANDLE_W / 2, [padLeft]);

  // volume scaling
  const maxVol    = Math.max(...candles.map(c => c.volume || 0), 1);
  const toVolH    = (v) => ((v || 0) / maxVol) * (VOLUME_H - 4);
  const volBaseY  = CHART_HEIGHT + VOLUME_H - 4;

  // Build swing index set for quick lookup
  const swingByIndex = {};
  labels.forEach(l => { swingByIndex[l.index] = l; });

  // Price axis ticks
  const TICK_COUNT = 6;
  const priceTicks = Array.from({ length: TICK_COUNT }, (_, i) => minPrice + (priceRange / (TICK_COUNT - 1)) * i);

  // Time axis ticks (every ~10 candles)
  const timeTicks = candles
    .map((c, i) => ({ ...c, i }))
    .filter((_, i) => i % Math.max(1, Math.floor(n / 8)) === 0);

  const onMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const idx  = Math.round((x - padLeft) / (CANDLE_W + CANDLE_GAP));
    if (idx >= 0 && idx < candles.length) {
      const c = candles[idx];
      setTooltip({ idx, c, x: toX(idx), y: toY(c.close) });
    }
  };

  return (
    <div className="overflow-x-auto border rounded bg-gray-950 relative" style={{ maxWidth: '100%' }}>
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ display: 'block', fontFamily: 'monospace', fontSize: 11 }}
      >
        {/* Background */}
        <rect width={svgW} height={svgH} fill="#0d1117" />

        {/* Grid lines */}
        {priceTicks.map((p, i) => (
          <g key={i}>
            <line x1={padLeft} y1={toY(p)} x2={svgW - padRight} y2={toY(p)} stroke="#1f2937" strokeDasharray="3,4" />
            <text x={padLeft - 4} y={toY(p) + 4} fill="#6b7280" textAnchor="end" fontSize={10}>{p.toFixed(0)}</text>
          </g>
        ))}

        {/* Time axis labels */}
        {timeTicks.map(({ i, time }) => (
          <text key={i} x={toX(i)} y={CHART_HEIGHT - 2} fill="#6b7280" textAnchor="middle" fontSize={9}>
            {formatTime(time, interval)}
          </text>
        ))}

        {/* Volume bars */}
        {candles.map((c, i) => (
          <rect
            key={`vol-${i}`}
            x={toX(i) - CANDLE_W / 2}
            y={volBaseY - toVolH(c.volume)}
            width={CANDLE_W}
            height={toVolH(c.volume)}
            fill={c.close >= c.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}
          />
        ))}

        {/* Structure event lines (BOS / CHoCH) */}
        {structureEvents.map((ev, i) => {
          const x1 = padLeft;
          const x2 = svgW - padRight;
          const y  = toY(ev.level);
          const isBos = ev.type === 'BOS';
          const color = ev.direction === 'bullish'
            ? (isBos ? '#34d399' : '#f59e0b')
            : (isBos ? '#f87171' : '#f59e0b');
          return (
            <g key={`ev-${i}`}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={1} strokeDasharray="6,4" opacity={0.75} />
              <rect x={x2 - 42} y={y - 9} width={40} height={13} rx={3} fill={color} opacity={0.85} />
              <text x={x2 - 22} y={y + 1} fill="#0d1117" textAnchor="middle" fontSize={9} fontWeight="bold">{ev.type}</text>
            </g>
          );
        })}

        {/* Swing high / low connector lines (zigzag) */}
        {labels.length > 1 && (() => {
          const pts = labels.map(l => ({
            x: toX(l.index),
            y: l.type === 'high' ? toY(l.price) - 12 : toY(l.price) + 12
          }));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          return <path d={d} fill="none" stroke="#374151" strokeWidth={1} strokeDasharray="4,3" />;
        })()}

        {/* Candlesticks */}
        {candles.map((c, i) => {
          const cx    = toX(i);
          const bodyT = toY(Math.max(c.open, c.close));
          const bodyB = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(bodyB - bodyT, 1);
          const isUp  = c.close >= c.open;
          const color = isUp ? '#10b981' : '#ef4444';
          return (
            <g key={`c-${i}`}>
              {/* wick */}
              <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={color} strokeWidth={1} />
              {/* body */}
              <rect x={cx - CANDLE_W / 2} y={bodyT} width={CANDLE_W} height={bodyH} fill={color} />
            </g>
          );
        })}

        {/* Swing labels */}
        {labels.map((l, i) => {
          const cx = toX(l.index);
          const isHigh = l.type === 'high';
          const color =
            l.label === 'HH' ? '#34d399' :
            l.label === 'HL' ? '#6ee7b7' :
            l.label === 'LL' ? '#f87171' :
            l.label === 'LH' ? '#fca5a5' : '#9ca3af';
          const y = isHigh ? toY(l.price) - 18 : toY(l.price) + 20;
          return (
            <g key={`sw-${i}`}>
              {/* triangle marker */}
              {isHigh
                ? <polygon points={`${cx},${toY(l.price) - 6} ${cx - 4},${toY(l.price) - 13} ${cx + 4},${toY(l.price) - 13}`} fill={color} />
                : <polygon points={`${cx},${toY(l.price) + 6} ${cx - 4},${toY(l.price) + 13} ${cx + 4},${toY(l.price) + 13}`} fill={color} />
              }
              <text x={cx} y={y} fill={color} textAnchor="middle" fontSize={9} fontWeight="bold">{l.label}</text>
            </g>
          );
        })}

        {/* Tooltip crosshair */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={padTop} x2={tooltip.x} y2={CHART_HEIGHT - padBot} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" opacity={0.6} />
            <rect x={tooltip.x + 8} y={toY(tooltip.c.high) - 6} width={160} height={72} rx={4} fill="#1f2937" stroke="#374151" />
            <text x={tooltip.x + 16} y={toY(tooltip.c.high) + 8}  fill="#e5e7eb" fontSize={10}>O {tooltip.c.open}</text>
            <text x={tooltip.x + 16} y={toY(tooltip.c.high) + 20} fill="#10b981" fontSize={10}>H {tooltip.c.high}</text>
            <text x={tooltip.x + 16} y={toY(tooltip.c.high) + 32} fill="#ef4444" fontSize={10}>L {tooltip.c.low}</text>
            <text x={tooltip.x + 16} y={toY(tooltip.c.high) + 44} fill="#e5e7eb" fontSize={10}>C {tooltip.c.close}</text>
            <text x={tooltip.x + 16} y={toY(tooltip.c.high) + 58} fill="#6b7280" fontSize={9}>{formatTime(tooltip.c.time, interval)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MarketStructure() {
  const [interval, setInterval] = useState('1h');
  const [range,    setRange]    = useState('5d');
  const [candles,  setCandles]  = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const load = useCallback(async (iv, rng) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/market-structure/xauusd?interval=${iv}&range=${rng}`, { credentials: 'include' });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.error || `Failed to load market data (HTTP ${res.status})`); setLoading(false); return; }
      const data = await res.json();
      const c    = data.candles || [];
      setCandles(c);
      setAnalysis(analyzeMarketStructure(c, SWING_LOOKBACK));
    } catch (err) {
      setError(`Network error – could not reach market data service: ${err.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(interval, range); }, [load, interval, range]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const trend      = analysis ? analysis.trend : 'unknown';

  const trendColor =
    trend === 'bullish' ? 'bg-green-800 text-green-100' :
    trend === 'bearish' ? 'bg-red-800   text-red-100'   :
    'bg-gray-700 text-gray-200';

  const trendIcon =
    trend === 'bullish' ? '▲' :
    trend === 'bearish' ? '▼' : '—';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gold / USD Market Structure</h1>
          <p className="text-sm text-gray-500 mt-1">
            ICT market-structure analysis – swing highs/lows, Break of Structure (BOS) and Change of Character (CHoCH).
          </p>
        </div>
        {lastCandle && (
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-500">${lastCandle.close.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">XAUUSD · last close</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Interval */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Interval</label>
          <div className="inline-flex rounded border overflow-hidden">
            {[['1h','1H'], ['1d','1D']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setInterval(val)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${interval === val ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Range */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Range</label>
          <div className="inline-flex rounded border overflow-hidden">
            {[['5d','5D'], ['1mo','1M'], ['3mo','3M']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${range === val ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => load(interval, range)}
            className="px-4 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >↻ Refresh</button>
        </div>
      </div>

      {/* Trend badge */}
      {analysis && (
        <div className="flex flex-wrap gap-3 mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${trendColor}`}>
            {trendIcon} {trend.charAt(0).toUpperCase() + trend.slice(1)} structure
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
            {analysis.swings.length} swing points detected
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
            {analysis.structureEvents.filter(e => e.type === 'BOS').length} BOS &nbsp;·&nbsp;
            {analysis.structureEvents.filter(e => e.type === 'CHoCH').length} CHoCH
          </span>
        </div>
      )}

      {/* Chart */}
      {loading && (
        <div className="text-gray-500 py-12 text-center">
          <div className="text-4xl mb-2">⏳</div>Loading Gold/USD data…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">{error}</div>
      )}

      {!loading && !error && candles.length > 0 && analysis && (
        <CandlestickChart
          candles={candles}
          labels={analysis.labels}
          structureEvents={analysis.structureEvents}
          interval={interval}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span><span className="font-bold text-green-400">HH</span> – Higher High</span>
        <span><span className="font-bold text-green-300">HL</span> – Higher Low</span>
        <span><span className="font-bold text-red-400">LH</span>  – Lower High</span>
        <span><span className="font-bold text-red-300">LL</span>  – Lower Low</span>
        <span><span className="font-bold text-green-400">━━</span> BOS bullish (dashed green)</span>
        <span><span className="font-bold text-red-400">━━</span> BOS bearish (dashed red)</span>
        <span><span className="font-bold text-yellow-400">━━</span> CHoCH (dashed amber)</span>
      </div>

      {/* Swing-point table */}
      {analysis && analysis.labels.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent swing points</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Label</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...analysis.labels].reverse().slice(0, 12).map((l, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50 border-t">
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        l.label === 'HH' ? 'bg-green-100 text-green-700' :
                        l.label === 'HL' ? 'bg-emerald-50 text-emerald-600' :
                        l.label === 'LL' ? 'bg-red-100 text-red-700' :
                        l.label === 'LH' ? 'bg-rose-50 text-rose-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{l.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">${l.price.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-500">{formatTime(candles[l.index]?.time, interval)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Structure events table */}
      {analysis && analysis.structureEvents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Structure events</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Direction</th>
                  <th className="px-3 py-2 text-right">Level</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...analysis.structureEvents].reverse().slice(0, 10).map((ev, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50 border-t">
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ev.type === 'BOS' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${ev.direction === 'bullish' ? 'text-green-600' : 'text-red-600'}`}>
                        {ev.direction === 'bullish' ? '▲ Bullish' : '▼ Bearish'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">${ev.level.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-500">{formatTime(candles[ev.breakIndex]?.time, interval)}</td>
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
