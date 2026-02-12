import {
  BottomScore, TopScore, RiskAssessment, RiskLevel,
  Urgency, TradeDirection, PriceTrigger, OnChainIndicators,
} from '../types';
import { BOTTOM_EXPOSURE_MAP, TOP_EXPOSURE_MAP } from '../config';

function determineRiskLevel(bottom: BottomScore, top: TopScore): RiskLevel {
  const hasBottom = bottom.score > 0;
  const hasTop = top.score > 0;

  if (hasBottom && !hasTop) return 'ACUMULAR';
  if (!hasBottom && hasTop) return 'DISTRIBUIR';
  if (hasBottom && hasTop)  return 'INCERTEZA';
  return 'NEUTRO';
}

function determineUrgency(bottom: BottomScore, top: TopScore): Urgency {
  const maxScore = Math.max(bottom.score, top.score);
  if (maxScore >= 5) return 'CRITICAL';
  if (maxScore >= 3) return 'HIGH';
  if (maxScore >= 1) return 'MEDIUM';
  return 'LOW';
}

function determineAction(level: RiskLevel, bottom: BottomScore, top: TopScore): TradeDirection {
  // Top signals take priority (capital preservation)
  if (level === 'DISTRIBUIR' && top.score >= 2) return 'SELL_SOL';
  if (level === 'ACUMULAR' && bottom.score >= 2) return 'BUY_SOL';
  if (level === 'INCERTEZA') {
    // When both fire, top takes priority
    if (top.score >= bottom.score) return 'SELL_SOL';
    return 'HOLD';
  }
  return 'HOLD';
}

function calculateExposure(level: RiskLevel, bottom: BottomScore, top: TopScore): number {
  switch (level) {
    case 'ACUMULAR': {
      // More bottom signals = more SOL exposure
      const baseExposure = BOTTOM_EXPOSURE_MAP[bottom.score] || 0;
      return Math.min(100, baseExposure);
    }
    case 'DISTRIBUIR': {
      // More top signals = less SOL exposure (sell to USDC)
      const sellPercent = TOP_EXPOSURE_MAP[top.score] || 0;
      return Math.max(50, 100 - sellPercent);
    }
    case 'INCERTEZA':
      return 50; // Hedge: stay balanced
    case 'NEUTRO':
    default:
      return 50; // Default: balanced
  }
}

function calculatePriceTriggers(indicators: OnChainIndicators): PriceTrigger[] {
  const triggers: PriceTrigger[] = [];
  const btcPrice = indicators.btcPrice;

  // Mayer Multiple triggers
  if (indicators.sma200 > 0) {
    triggers.push({
      price: Math.round(indicators.sma200 * 0.7), // Mayer 0.7 = STRONG bottom
      label: 'Mayer Multiple STRONG bottom (0.7)',
      direction: 'below',
    });
    triggers.push({
      price: Math.round(indicators.sma200 * 2.0), // Mayer 2.0 = STRONG top
      label: 'Mayer Multiple STRONG top (2.0)',
      direction: 'above',
    });
    triggers.push({
      price: Math.round(indicators.sma200 * 2.4), // Mayer 2.4 = EXTREME top
      label: 'Mayer Multiple EXTREME top (2.4)',
      direction: 'above',
    });
  }

  // MVRV triggers (price / realized_price * current_mvrv = target_mvrv)
  if (indicators.realizedPrice > 0) {
    triggers.push({
      price: Math.round(indicators.realizedPrice * 0.8), // MVRV 0.8 = STRONG bottom
      label: 'MVRV STRONG bottom (0.8)',
      direction: 'below',
    });
    triggers.push({
      price: Math.round(indicators.realizedPrice * 1.0), // MVRV 1.0 = WATCH bottom
      label: 'MVRV at Realized Price (1.0)',
      direction: 'below',
    });
    triggers.push({
      price: Math.round(indicators.realizedPrice * 3.0), // MVRV 3.0 = STRONG top
      label: 'MVRV STRONG top (3.0)',
      direction: 'above',
    });
  }

  // Terminal Price triggers
  if (indicators.terminalPrice > 0) {
    triggers.push({
      price: Math.round(indicators.terminalPrice * 0.8), // 80% of terminal
      label: 'Terminal Price 80% (STRONG top zone)',
      direction: 'above',
    });
    triggers.push({
      price: Math.round(indicators.terminalPrice * 0.9), // 90% of terminal
      label: 'Terminal Price 90% (EXTREME top zone)',
      direction: 'above',
    });
  }

  // STH Cost Basis
  if (indicators.sthCostBasis > 0) {
    triggers.push({
      price: indicators.sthCostBasis,
      label: 'STH Cost Basis (short-term holder breakeven)',
      direction: btcPrice < indicators.sthCostBasis ? 'above' : 'below',
    });
  }

  // True Market Mean
  if (indicators.trueMarketMean > 0) {
    triggers.push({
      price: indicators.trueMarketMean,
      label: 'True Market Mean (fair value midpoint)',
      direction: btcPrice < indicators.trueMarketMean ? 'above' : 'below',
    });
  }

  // Sort by distance from current price
  triggers.sort((a, b) => Math.abs(a.price - btcPrice) - Math.abs(b.price - btcPrice));

  return triggers;
}

function buildRationale(level: RiskLevel, bottom: BottomScore, top: TopScore): string[] {
  const rationale: string[] = [];

  rationale.push(`Risk Level: ${level}`);
  rationale.push(`Bottom Score: ${bottom.score}/${bottom.maxScore} | Top Score: ${top.score}/${top.maxScore}`);

  if (bottom.score > 0) {
    const activeBottom = bottom.signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME');
    rationale.push(`Active bottom signals: ${activeBottom.map(s => `${s.name} (${s.tier})`).join(', ')}`);
  }

  if (top.score > 0) {
    const activeTop = top.signals.filter(s => s.tier === 'STRONG' || s.tier === 'EXTREME');
    rationale.push(`Active top signals: ${activeTop.map(s => `${s.name} (${s.tier})`).join(', ')}`);
  }

  for (const c of bottom.convergences) rationale.push(`[BOTTOM] ${c}`);
  for (const c of top.convergences)    rationale.push(`[TOP] ${c}`);

  switch (level) {
    case 'ACUMULAR':
      rationale.push('Recommendation: Increase SOL exposure. BTC on-chain data suggests market bottom conditions.');
      break;
    case 'DISTRIBUIR':
      rationale.push('Recommendation: Reduce SOL exposure. BTC on-chain data suggests market top conditions.');
      break;
    case 'INCERTEZA':
      rationale.push('Recommendation: Exercise caution. Mixed signals detected. Hedge with balanced allocation.');
      break;
    case 'NEUTRO':
      rationale.push('Recommendation: Hold current positions. No strong directional signal from BTC on-chain data.');
      break;
  }

  return rationale;
}

export function assessRisk(
  indicators: OnChainIndicators,
  bottom: BottomScore,
  top: TopScore
): RiskAssessment {
  const level = determineRiskLevel(bottom, top);
  const urgency = determineUrgency(bottom, top);
  const suggestedAction = determineAction(level, bottom, top);
  const exposurePercent = calculateExposure(level, bottom, top);
  const priceTriggers = calculatePriceTriggers(indicators);
  const rationale = buildRationale(level, bottom, top);

  return {
    level,
    urgency,
    suggestedAction,
    exposurePercent,
    bottomScore: bottom,
    topScore: top,
    priceTriggers,
    rationale,
  };
}
