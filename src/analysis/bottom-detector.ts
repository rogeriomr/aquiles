import { OnChainIndicators, Signal, SignalTier, BottomScore } from '../types';
import { BOTTOM_THRESHOLDS } from '../config';

function classifyBottom(value: number, thresholds: { watch: number; strong: number; extreme: number }, inverted = false): SignalTier {
  // For bottom detection, lower values = stronger signal (except inverted)
  if (inverted) {
    if (value >= thresholds.watch)   return 'NORMAL';
    if (value >= thresholds.strong)  return 'WATCH';
    if (value >= thresholds.extreme) return 'STRONG';
    return 'EXTREME';
  }
  // Default: lower is more extreme
  if (value >= thresholds.watch)   return 'NORMAL';
  if (value >= thresholds.strong)  return 'WATCH';
  if (value >= thresholds.extreme) return 'STRONG';
  return 'EXTREME';
}

export function detectBottom(indicators: OnChainIndicators): BottomScore {
  const signals: Signal[] = [];

  // 1. MVRV Ratio (Market Value to Realized Value)
  // < 1.0 means market is below aggregate cost basis
  signals.push({
    name: 'MVRV',
    value: indicators.mvrv,
    tier: classifyBottom(indicators.mvrv, BOTTOM_THRESHOLDS.mvrv),
    threshold: `<= ${BOTTOM_THRESHOLDS.mvrv.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.mvrv.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.mvrv.extreme} (EXTREME)`,
    description: indicators.mvrv <= BOTTOM_THRESHOLDS.mvrv.watch
      ? `MVRV at ${indicators.mvrv.toFixed(2)} - market below realized value, historically a buying zone`
      : `MVRV at ${indicators.mvrv.toFixed(2)} - market above realized value`,
  });

  // 2. STH MVRV (Short-Term Holder MVRV)
  // < 1.0 means short-term holders are underwater
  signals.push({
    name: 'STH MVRV',
    value: indicators.sthMvrv,
    tier: classifyBottom(indicators.sthMvrv, BOTTOM_THRESHOLDS.sthMvrv),
    threshold: `<= ${BOTTOM_THRESHOLDS.sthMvrv.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.sthMvrv.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.sthMvrv.extreme} (EXTREME)`,
    description: indicators.sthMvrv <= BOTTOM_THRESHOLDS.sthMvrv.watch
      ? `STH MVRV at ${indicators.sthMvrv.toFixed(2)} - short-term holders at loss, capitulation signal`
      : `STH MVRV at ${indicators.sthMvrv.toFixed(2)} - short-term holders in profit`,
  });

  // 3. Mayer Multiple (Price / 200-day SMA)
  // < 0.8 means price far below 200d moving average
  signals.push({
    name: 'Mayer Multiple',
    value: indicators.mayerMultiple,
    tier: classifyBottom(indicators.mayerMultiple, BOTTOM_THRESHOLDS.mayerMultiple),
    threshold: `<= ${BOTTOM_THRESHOLDS.mayerMultiple.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.mayerMultiple.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.mayerMultiple.extreme} (EXTREME)`,
    description: indicators.mayerMultiple <= BOTTOM_THRESHOLDS.mayerMultiple.watch
      ? `Mayer Multiple at ${indicators.mayerMultiple.toFixed(2)} - price far below 200d MA, deep discount zone`
      : `Mayer Multiple at ${indicators.mayerMultiple.toFixed(2)} - price near or above 200d MA`,
  });

  // 4. Realized Price Ratio (BTC Price / Realized Price)
  // Close to 1.0 or below = price near aggregate cost basis
  signals.push({
    name: 'Realized Price Ratio',
    value: indicators.realizedPriceRatio,
    tier: classifyBottom(indicators.realizedPriceRatio, BOTTOM_THRESHOLDS.realizedPriceRatio),
    threshold: `<= ${BOTTOM_THRESHOLDS.realizedPriceRatio.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.realizedPriceRatio.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.realizedPriceRatio.extreme} (EXTREME)`,
    description: indicators.realizedPriceRatio <= BOTTOM_THRESHOLDS.realizedPriceRatio.watch
      ? `Realized Price Ratio at ${indicators.realizedPriceRatio.toFixed(2)} - price approaching aggregate cost basis`
      : `Realized Price Ratio at ${indicators.realizedPriceRatio.toFixed(2)} - price well above realized price`,
  });

  // 5. LTH SOPR (Long-Term Holder Spent Output Profit Ratio)
  // < 1.0 means long-term holders selling at a loss
  signals.push({
    name: 'LTH SOPR',
    value: indicators.lthSopr,
    tier: classifyBottom(indicators.lthSopr, BOTTOM_THRESHOLDS.lthSopr),
    threshold: `<= ${BOTTOM_THRESHOLDS.lthSopr.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.lthSopr.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.lthSopr.extreme} (EXTREME)`,
    description: indicators.lthSopr <= BOTTOM_THRESHOLDS.lthSopr.watch
      ? `LTH SOPR at ${indicators.lthSopr.toFixed(2)} - long-term holders selling at loss, deep capitulation`
      : `LTH SOPR at ${indicators.lthSopr.toFixed(2)} - long-term holders selling in profit`,
  });

  // 6. AVIV Ratio (Active Value to Investor Value)
  // Low values = market undervalued relative to active investors
  signals.push({
    name: 'AVIV Ratio',
    value: indicators.avivRatio,
    tier: classifyBottom(indicators.avivRatio, BOTTOM_THRESHOLDS.avivRatio),
    threshold: `<= ${BOTTOM_THRESHOLDS.avivRatio.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.avivRatio.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.avivRatio.extreme} (EXTREME)`,
    description: indicators.avivRatio <= BOTTOM_THRESHOLDS.avivRatio.watch
      ? `AVIV Ratio at ${indicators.avivRatio.toFixed(3)} - market undervalued vs active investors`
      : `AVIV Ratio at ${indicators.avivRatio.toFixed(3)} - market fairly valued or above`,
  });

  // 7. CVDD Ratio (Cumulative Value Days Destroyed ratio)
  // Low values = price near CVDD floor support
  signals.push({
    name: 'CVDD Ratio',
    value: indicators.cvddRatio,
    tier: classifyBottom(indicators.cvddRatio, BOTTOM_THRESHOLDS.cvddRatio),
    threshold: `<= ${BOTTOM_THRESHOLDS.cvddRatio.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.cvddRatio.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.cvddRatio.extreme} (EXTREME)`,
    description: indicators.cvddRatio <= BOTTOM_THRESHOLDS.cvddRatio.watch
      ? `CVDD Ratio at ${indicators.cvddRatio.toFixed(2)} - price near CVDD floor, strong support zone`
      : `CVDD Ratio at ${indicators.cvddRatio.toFixed(2)} - price well above CVDD floor`,
  });

  // 8. Terminal Price Ratio (BTC Price / Terminal Price)
  // Low values = price far from terminal price ceiling
  signals.push({
    name: 'Terminal Price Ratio',
    value: indicators.terminalPriceRatio,
    tier: classifyBottom(indicators.terminalPriceRatio, BOTTOM_THRESHOLDS.terminalPriceRatio),
    threshold: `<= ${BOTTOM_THRESHOLDS.terminalPriceRatio.watch} (WATCH) / <= ${BOTTOM_THRESHOLDS.terminalPriceRatio.strong} (STRONG) / <= ${BOTTOM_THRESHOLDS.terminalPriceRatio.extreme} (EXTREME)`,
    description: indicators.terminalPriceRatio <= BOTTOM_THRESHOLDS.terminalPriceRatio.watch
      ? `Terminal Price Ratio at ${indicators.terminalPriceRatio.toFixed(2)} - price far below terminal, deep value zone`
      : `Terminal Price Ratio at ${indicators.terminalPriceRatio.toFixed(2)} - price approaching terminal valuation`,
  });

  // Count STRONG and EXTREME signals
  const score = signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME').length;

  // Detect convergences (multiple indicators in same zone)
  const convergences: string[] = [];
  const strongOrExtreme = signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME');

  if (strongOrExtreme.length >= 3) {
    convergences.push(`${strongOrExtreme.length} indicators converging in bottom zone: ${strongOrExtreme.map(s => s.name).join(', ')}`);
  }

  const mvrvAndSth = signals.filter(s => (s.name === 'MVRV' || s.name === 'STH MVRV') && (s.tier === 'STRONG' || s.tier === 'EXTREME'));
  if (mvrvAndSth.length === 2) {
    convergences.push('Both MVRV and STH MVRV in bottom zone - strong conviction signal');
  }

  const mayerAndRealized = signals.filter(s => (s.name === 'Mayer Multiple' || s.name === 'Realized Price Ratio') && (s.tier === 'STRONG' || s.tier === 'EXTREME'));
  if (mayerAndRealized.length === 2) {
    convergences.push('Mayer Multiple + Realized Price Ratio convergence - price deeply discounted');
  }

  if (signals.find(s => s.name === 'LTH SOPR' && (s.tier === 'STRONG' || s.tier === 'EXTREME'))) {
    convergences.push('LTH SOPR below 1.0 - long-term holders capitulating (rare and significant)');
  }

  return {
    score,
    maxScore: 8,
    signals,
    convergences,
  };
}
