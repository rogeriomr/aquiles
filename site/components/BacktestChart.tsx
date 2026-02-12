'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { backtestData } from '@/data/backtest';

// Group consecutive months with the same signal into zones
function getSignalZones() {
  const zones: { start: string; end: string; signal: 'ACCUMULATE' | 'DISTRIBUTE' }[] = [];
  let currentZone: { start: string; signal: 'ACCUMULATE' | 'DISTRIBUTE' } | null = null;

  for (const point of backtestData) {
    if (point.signal === 'ACCUMULATE' || point.signal === 'DISTRIBUTE') {
      if (!currentZone || currentZone.signal !== point.signal) {
        if (currentZone) {
          zones.push({ ...currentZone, end: backtestData[backtestData.indexOf(point) - 1]?.date || point.date });
        }
        currentZone = { start: point.date, signal: point.signal };
      }
    } else {
      if (currentZone) {
        zones.push({ ...currentZone, end: point.date });
        currentZone = null;
      }
    }
  }

  if (currentZone) {
    zones.push({ ...currentZone, end: backtestData[backtestData.length - 1].date });
  }

  return zones;
}

const zones = getSignalZones();

// Format price for log scale display
function formatPrice(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  const point = backtestData.find(d => d.date === label);
  if (!point) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{point.date}</p>
      <p className="text-white font-mono font-semibold">
        ${point.btcPrice.toLocaleString()}
      </p>
      <p className="text-slate-400 text-xs mt-1">MVRV: {point.mvrv}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          point.signal === 'ACCUMULATE' ? 'bg-emerald-400/20 text-emerald-400' :
          point.signal === 'DISTRIBUTE' ? 'bg-red-400/20 text-red-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {point.signal}
        </span>
        {point.bottomScore > 0 && (
          <span className="text-xs text-emerald-400">Bottom: {point.bottomScore}/8</span>
        )}
        {point.topScore > 0 && (
          <span className="text-xs text-red-400">Top: {point.topScore}/6</span>
        )}
      </div>
    </div>
  );
}

// Log scale ticks for BTC price
const logTicks = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export default function BacktestChart() {
  // Show every 6th label to avoid crowding
  const xTicks = backtestData
    .filter((_, i) => i % 12 === 0)
    .map(d => d.date);

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Proven Across Every Bitcoin Cycle
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Green zones show when Aquiles detected accumulation opportunities.
            Red zones show distribution signals near cycle tops.
          </p>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-400/40 border border-emerald-400/60" />
            <span className="text-sm text-slate-400">Accumulate Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400/40 border border-red-400/60" />
            <span className="text-sm text-slate-400">Distribute Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white" />
            <span className="text-sm text-slate-400">BTC Price</span>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6">
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={backtestData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

              <XAxis
                dataKey="date"
                ticks={xTicks}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />

              <YAxis
                scale="log"
                domain={[150, 120000]}
                ticks={logTicks}
                tickFormatter={formatPrice}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                width={60}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Signal zones */}
              {zones.map((zone, i) => (
                <ReferenceArea
                  key={i}
                  x1={zone.start}
                  x2={zone.end}
                  fill={zone.signal === 'ACCUMULATE' ? '#34d399' : '#f87171'}
                  fillOpacity={0.08}
                  stroke={zone.signal === 'ACCUMULATE' ? '#34d399' : '#f87171'}
                  strokeOpacity={0.2}
                />
              ))}

              {/* BTC Price line */}
              <Line
                type="monotone"
                dataKey="btcPrice"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
