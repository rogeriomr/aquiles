'use client';

import { performanceData, backtestData } from '@/data/backtest';

export default function Stats() {
  const lastPoint = performanceData[performanceData.length - 1];
  const bhReturn = ((lastPoint.buyAndHold - 10000) / 10000 * 100);
  const aqReturn = ((lastPoint.aquilesStrategy - 10000) / 10000 * 100);

  // Count correct signals
  const accumulateSignals = backtestData.filter(d => d.signal === 'ACCUMULATE');
  const distributeSignals = backtestData.filter(d => d.signal === 'DISTRIBUTE');

  const stats = [
    {
      label: 'Aquiles Return',
      value: `${aqReturn.toFixed(0)}%`,
      subtext: `From $10K → $${(lastPoint.aquilesStrategy / 1000).toFixed(0)}K`,
      color: 'text-emerald-400',
    },
    {
      label: 'Buy & Hold Return',
      value: `${bhReturn.toFixed(0)}%`,
      subtext: `From $10K → $${(lastPoint.buyAndHold / 1000).toFixed(0)}K`,
      color: 'text-slate-400',
    },
    {
      label: 'Accumulate Months',
      value: `${accumulateSignals.length}`,
      subtext: 'Months with buy signal active',
      color: 'text-emerald-400',
    },
    {
      label: 'Distribute Months',
      value: `${distributeSignals.length}`,
      subtext: 'Months with sell signal active',
      color: 'text-red-400',
    },
    {
      label: 'Cycles Covered',
      value: '4',
      subtext: '2015, 2018, 2021, 2022 bottoms',
      color: 'text-blue-400',
    },
    {
      label: 'Indicators Tracked',
      value: '14',
      subtext: '8 bottom + 6 top signals',
      color: 'text-blue-400',
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Performance Metrics
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Key statistics from 11+ years of backtesting across every major Bitcoin cycle.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition-colors"
            >
              <div className={`text-3xl md:text-4xl font-bold font-mono ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-white text-sm font-medium mb-1">{stat.label}</div>
              <div className="text-slate-500 text-xs">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
