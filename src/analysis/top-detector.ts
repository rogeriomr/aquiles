import { OnChainIndicators, Signal, SignalTier, TopScore } from '../types';
import { TOP_THRESHOLDS } from '../config';

function classifyTop(value: number, thresholds: { watch: number; strong: number; extreme: number }): SignalTier {
  // For top detection, higher values = stronger signal
  if (value < thresholds.watch)   return 'NORMAL';
  if (value < thresholds.strong)  return 'WATCH';
  if (value < thresholds.extreme) return 'STRONG';
  return 'EXTREME';
}

export function detectTop(indicators: OnChainIndicators): TopScore {
  const signals: Signal[] = [];

  // 1. MVRV Ratio - high values = market overvalued
  signals.push({
    name: 'MVRV',
    value: indicators.mvrv,
    tier: classifyTop(indicators.mvrv, TOP_THRESHOLDS.mvrv),
    threshold: `>= ${TOP_THRESHOLDS.mvrv.watch} (WATCH) / >= ${TOP_THRESHOLDS.mvrv.strong} (STRONG) / >= ${TOP_THRESHOLDS.mvrv.extreme} (EXTREME)`,
    description: indicators.mvrv >= TOP_THRESHOLDS.mvrv.watch
      ? `MVRV at ${indicators.mvrv.toFixed(2)} - market significantly above realized value, overheated`
      : `MVRV at ${indicators.mvrv.toFixed(2)} - market not yet overvalued`,
  });

  // 2. STH MVRV - high values = short-term holders in deep profit
  signals.push({
    name: 'STH MVRV',
    value: indicators.sthMvrv,
    tier: classifyTop(indicators.sthMvrv, TOP_THRESHOLDS.sthMvrv),
    threshold: `>= ${TOP_THRESHOLDS.sthMvrv.watch} (WATCH) / >= ${TOP_THRESHOLDS.sthMvrv.strong} (STRONG) / >= ${TOP_THRESHOLDS.sthMvrv.extreme} (EXTREME)`,
    description: indicators.sthMvrv >= TOP_THRESHOLDS.sthMvrv.watch
      ? `STH MVRV at ${indicators.sthMvrv.toFixed(2)} - short-term holders deeply in profit, distribution likely`
      : `STH MVRV at ${indicators.sthMvrv.toFixed(2)} - short-term holders not yet euphoric`,
  });

  // 3. Mayer Multiple - price far above 200d MA
  signals.push({
    name: 'Mayer Multiple',
    value: indicators.mayerMultiple,
    tier: classifyTop(indicators.mayerMultiple, TOP_THRESHOLDS.mayerMultiple),
    threshold: `>= ${TOP_THRESHOLDS.mayerMultiple.watch} (WATCH) / >= ${TOP_THRESHOLDS.mayerMultiple.strong} (STRONG) / >= ${TOP_THRESHOLDS.mayerMultiple.extreme} (EXTREME)`,
    description: indicators.mayerMultiple >= TOP_THRESHOLDS.mayerMultiple.watch
      ? `Mayer Multiple at ${indicators.mayerMultiple.toFixed(2)} - price far above 200d MA, overextended`
      : `Mayer Multiple at ${indicators.mayerMultiple.toFixed(2)} - price not overextended vs 200d MA`,
  });

  // 4. LTH MVRV - long-term holders extremely profitable
  signals.push({
    name: 'LTH MVRV',
    value: indicators.lthMvrv,
    tier: classifyTop(indicators.lthMvrv, TOP_THRESHOLDS.lthMvrv),
    threshold: `>= ${TOP_THRESHOLDS.lthMvrv.watch} (WATCH) / >= ${TOP_THRESHOLDS.lthMvrv.strong} (STRONG) / >= ${TOP_THRESHOLDS.lthMvrv.extreme} (EXTREME)`,
    description: indicators.lthMvrv >= TOP_THRESHOLDS.lthMvrv.watch
      ? `LTH MVRV at ${indicators.lthMvrv.toFixed(2)} - long-term holders very profitable, likely distributing`
      : `LTH MVRV at ${indicators.lthMvrv.toFixed(2)} - long-term holders not yet at extreme profit`,
  });

  // 5. AVIV Ratio - market premium above investors' cost basis
  signals.push({
    name: 'AVIV Ratio',
    value: indicators.avivRatio,
    tier: classifyTop(indicators.avivRatio, TOP_THRESHOLDS.avivRatio),
    threshold: `>= ${TOP_THRESHOLDS.avivRatio.watch} (WATCH) / >= ${TOP_THRESHOLDS.avivRatio.strong} (STRONG) / >= ${TOP_THRESHOLDS.avivRatio.extreme} (EXTREME)`,
    description: indicators.avivRatio >= TOP_THRESHOLDS.avivRatio.watch
      ? `AVIV Ratio at ${indicators.avivRatio.toFixed(3)} - market at premium to active investor cost basis`
      : `AVIV Ratio at ${indicators.avivRatio.toFixed(3)} - market not yet at premium levels`,
  });

  // 6. Terminal Price Ratio - price approaching terminal ceiling
  signals.push({
    name: 'Terminal Price Ratio',
    value: indicators.terminalPriceRatio,
    tier: classifyTop(indicators.terminalPriceRatio, TOP_THRESHOLDS.terminalPriceRatio),
    threshold: `>= ${TOP_THRESHOLDS.terminalPriceRatio.watch} (WATCH) / >= ${TOP_THRESHOLDS.terminalPriceRatio.strong} (STRONG) / >= ${TOP_THRESHOLDS.terminalPriceRatio.extreme} (EXTREME)`,
    description: indicators.terminalPriceRatio >= TOP_THRESHOLDS.terminalPriceRatio.watch
      ? `Terminal Price Ratio at ${indicators.terminalPriceRatio.toFixed(2)} - price approaching terminal ceiling, extreme caution`
      : `Terminal Price Ratio at ${indicators.terminalPriceRatio.toFixed(2)} - price well below terminal ceiling`,
  });

  // Count STRONG and EXTREME signals
  const score = signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME').length;

  // Detect convergences
  const convergences: string[] = [];
  const strongOrExtreme = signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME');

  if (strongOrExtreme.length >= 3) {
    convergences.push(`${strongOrExtreme.length} top indicators converging: ${strongOrExtreme.map(s => s.name).join(', ')} - HIGH PROBABILITY TOP`);
  }

  const mvrvAndSth = signals.filter(s => (s.name === 'MVRV' || s.name === 'STH MVRV') && (s.tier === 'STRONG' || s.tier === 'EXTREME'));
  if (mvrvAndSth.length === 2) {
    convergences.push('Both MVRV and STH MVRV in top zone - strong distribution signal');
  }

  if (signals.find(s => s.name === 'Terminal Price Ratio' && (s.tier === 'STRONG' || s.tier === 'EXTREME'))) {
    convergences.push('Price approaching Terminal Price ceiling - historically marks cycle tops');
  }

  const mayerAndLth = signals.filter(s => (s.name === 'Mayer Multiple' || s.name === 'LTH MVRV') && (s.tier === 'STRONG' || s.tier === 'EXTREME'));
  if (mayerAndLth.length === 2) {
    convergences.push('Mayer Multiple + LTH MVRV both elevated - classic euphoria pattern');
  }

  return {
    score,
    maxScore: 6,
    signals,
    convergences,
  };
}
