'use client';

import {
  currentIndicators,
  currentBottomScore,
  currentTopScore,
  currentSignal,
} from '@/data/backtest';

export default function CurrentSignals() {
  const bottomIndicators = currentIndicators.filter(i => i.tier === 'bottom');
  const topIndicators = currentIndicators.filter(i => i.tier === 'top');

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Current Market Signals
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Real-time on-chain indicator analysis for Bitcoin. Updated with latest available data.
          </p>
        </div>

        {/* Signal summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Bottom score */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Bottom Score</h3>
            <ScoreGauge score={currentBottomScore} maxScore={8} color="emerald" />
            <p className="text-slate-500 text-xs mt-3">
              {currentBottomScore}/8 bottom indicators active
            </p>
          </div>

          {/* Current signal */}
          <div className={`rounded-xl p-6 text-center border ${
            currentSignal === 'ACCUMULATE'
              ? 'bg-emerald-400/5 border-emerald-400/20 glow-green'
              : currentSignal === 'DISTRIBUTE'
              ? 'bg-red-400/5 border-red-400/20 glow-red'
              : 'bg-slate-900/50 border-slate-800'
          }`}>
            <h3 className="text-slate-400 text-sm font-medium mb-3">Current Signal</h3>
            <div className={`text-3xl font-bold font-mono ${
              currentSignal === 'ACCUMULATE' ? 'text-emerald-400' :
              currentSignal === 'DISTRIBUTE' ? 'text-red-400' :
              'text-slate-300'
            }`}>
              {currentSignal}
            </div>
            <p className="text-slate-400 text-sm mt-3">
              {currentSignal === 'ACCUMULATE'
                ? 'Increase BTC Exposure'
                : currentSignal === 'DISTRIBUTE'
                ? 'Reduce BTC Exposure'
                : 'Maintain Current Position'}
            </p>
          </div>

          {/* Top score */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Top Score</h3>
            <ScoreGauge score={currentTopScore} maxScore={6} color="red" />
            <p className="text-slate-500 text-xs mt-3">
              {currentTopScore}/6 top indicators active
            </p>
          </div>
        </div>

        {/* Indicator cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bottom indicators */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Bottom Indicators
              <span className="text-sm text-slate-500 font-normal">({currentBottomScore}/8 active)</span>
            </h3>
            <div className="space-y-3">
              {bottomIndicators.map(indicator => (
                <IndicatorCard key={indicator.name} indicator={indicator} />
              ))}
            </div>
          </div>

          {/* Top indicators */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Top Indicators
              <span className="text-sm text-slate-500 font-normal">({currentTopScore}/6 active)</span>
            </h3>
            <div className="space-y-3">
              {topIndicators.map(indicator => (
                <IndicatorCard key={indicator.name} indicator={indicator} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreGauge({ score, maxScore, color }: { score: number; maxScore: number; color: 'emerald' | 'red' }) {
  const percentage = (score / maxScore) * 100;
  const colorClasses = color === 'emerald'
    ? { bar: 'bg-emerald-400', text: 'text-emerald-400', track: 'bg-emerald-400/10' }
    : { bar: 'bg-red-400', text: 'text-red-400', track: 'bg-red-400/10' };

  return (
    <div>
      <div className={`text-4xl font-bold font-mono ${colorClasses.text}`}>
        {score}<span className="text-lg text-slate-600">/{maxScore}</span>
      </div>
      <div className={`h-2 rounded-full ${colorClasses.track} mt-3 overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClasses.bar} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: { name: string; active: boolean; value: string; description: string; tier: string } }) {
  const isBottom = indicator.tier === 'bottom';
  const activeColor = isBottom ? 'emerald' : 'red';

  return (
    <div className={`rounded-lg p-4 border transition-all ${
      indicator.active
        ? isBottom
          ? 'bg-emerald-400/5 border-emerald-400/20'
          : 'bg-red-400/5 border-red-400/20'
        : 'bg-slate-900/30 border-slate-800/50'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${indicator.active ? 'text-white' : 'text-slate-500'}`}>
          {indicator.name}
        </span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${indicator.active ? (isBottom ? 'text-emerald-400' : 'text-red-400') : 'text-slate-600'}`}>
            {indicator.value}
          </span>
          <span className={`w-2 h-2 rounded-full ${
            indicator.active
              ? activeColor === 'emerald' ? 'bg-emerald-400' : 'bg-red-400'
              : 'bg-slate-700'
          }`} />
        </div>
      </div>
      <p className="text-xs text-slate-500">{indicator.description}</p>
    </div>
  );
}
