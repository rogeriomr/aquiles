'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { performanceData } from '@/data/backtest';

function formatValue(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-mono text-sm" style={{ color: entry.color }}>
          {entry.dataKey === 'aquilesStrategy' ? 'Aquiles' : 'Buy & Hold'}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function PerformanceChart() {
  const lastPoint = performanceData[performanceData.length - 1];
  const bhReturn = ((lastPoint.buyAndHold - 10000) / 10000 * 100).toFixed(0);
  const aqReturn = ((lastPoint.aquilesStrategy - 10000) / 10000 * 100).toFixed(0);

  // Calculate max drawdown for buy & hold
  let bhPeak = 0;
  let bhMaxDrawdown = 0;
  let aqPeak = 0;
  let aqMaxDrawdown = 0;

  for (const point of performanceData) {
    bhPeak = Math.max(bhPeak, point.buyAndHold);
    const bhDD = (bhPeak - point.buyAndHold) / bhPeak;
    bhMaxDrawdown = Math.max(bhMaxDrawdown, bhDD);

    aqPeak = Math.max(aqPeak, point.aquilesStrategy);
    const aqDD = (aqPeak - point.aquilesStrategy) / aqPeak;
    aqMaxDrawdown = Math.max(aqMaxDrawdown, aqDD);
  }

  const xTicks = performanceData
    .filter((_, i) => i % 12 === 0)
    .map(d => d.date);

  return (
    <section className="py-20 px-6 bg-slate-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Strategy vs Buy &amp; Hold
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Starting with $10,000 in January 2015. Aquiles follows on-chain signals
            to reduce exposure at tops and increase at bottoms.
          </p>
        </div>

        {/* Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 mb-8">
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={performanceData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                domain={['auto', 'auto']}
                tickFormatter={formatValue}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                width={70}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => (
                  <span className="text-slate-400 text-sm">
                    {value === 'aquilesStrategy' ? 'Aquiles Strategy' : 'Buy & Hold'}
                  </span>
                )}
              />

              <Line
                type="monotone"
                dataKey="buyAndHold"
                stroke="#64748b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />

              <Line
                type="monotone"
                dataKey="aquilesStrategy"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Return"
            bhValue={`${bhReturn}%`}
            aqValue={`${aqReturn}%`}
            advantage={Number(aqReturn) > Number(bhReturn)}
          />
          <MetricCard
            title="Max Drawdown"
            bhValue={`-${(bhMaxDrawdown * 100).toFixed(0)}%`}
            aqValue={`-${(aqMaxDrawdown * 100).toFixed(0)}%`}
            advantage={aqMaxDrawdown < bhMaxDrawdown}
          />
          <MetricCard
            title="Risk-Adjusted"
            bhValue="Passive"
            aqValue="Active Signals"
            advantage={true}
            description="On-chain signals reduce drawdowns while maintaining upside"
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  bhValue,
  aqValue,
  advantage,
  description,
}: {
  title: string;
  bhValue: string;
  aqValue: string;
  advantage: boolean;
  description?: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <h3 className="text-slate-400 text-sm font-medium mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">Buy &amp; Hold</span>
          <span className="font-mono text-slate-300">{bhValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 text-sm">Aquiles</span>
          <span className={`font-mono font-semibold ${advantage ? 'text-emerald-400' : 'text-slate-300'}`}>
            {aqValue}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-slate-500 text-xs mt-3">{description}</p>
      )}
    </div>
  );
}
