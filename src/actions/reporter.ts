import {
  RiskAssessment, OnChainIndicators, LoanWarning, TradeResult,
} from '../types';
import { formatUSD, formatPercent, formatRatio, formatSOL, formatUSDC, padRight, tierBar, tierEmoji } from '../utils/format';

export function generateFullReport(
  indicators: OnChainIndicators,
  risk: RiskAssessment,
  loanWarnings: LoanWarning[],
  tradeResult?: TradeResult
): string {
  const lines: string[] = [];
  const sep = '='.repeat(80);
  const thinSep = '-'.repeat(80);

  lines.push(sep);
  lines.push('  AQUILES - FULL ANALYSIS REPORT');
  lines.push(`  Generated: ${new Date().toISOString()}`);
  lines.push(`  Data Timestamp: ${indicators.timestamp}`);
  lines.push(sep);
  lines.push('');

  // --- Market Overview ---
  lines.push('  MARKET OVERVIEW');
  lines.push(thinSep);
  lines.push(`  BTC Price:          ${formatUSD(indicators.btcPrice)}`);
  lines.push(`  Realized Price:     ${formatUSD(indicators.realizedPrice)}`);
  lines.push(`  STH Cost Basis:     ${formatUSD(indicators.sthCostBasis)}`);
  lines.push(`  200-day SMA:        ${formatUSD(indicators.sma200)}`);
  lines.push(`  True Market Mean:   ${formatUSD(indicators.trueMarketMean)}`);
  lines.push(`  CVDD Floor:         ${formatUSD(indicators.cvddFloor)}`);
  lines.push(`  Terminal Price:     ${formatUSD(indicators.terminalPrice)}`);
  lines.push('');

  // --- Indicator Table ---
  lines.push('  ALL INDICATORS');
  lines.push(thinSep);
  lines.push(`  ${'Indicator'.padEnd(24)} ${'Value'.padStart(10)} ${'Bottom'.padEnd(10)} ${'Top'.padEnd(10)} ${'Visual'.padEnd(6)}`);
  lines.push(`  ${'-'.repeat(24)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(6)}`);

  // Map signals by name for easy lookup
  const bottomMap = new Map(risk.bottomScore.signals.map(s => [s.name, s]));
  const topMap = new Map(risk.topScore.signals.map(s => [s.name, s]));

  const allNames = new Set([
    ...risk.bottomScore.signals.map(s => s.name),
    ...risk.topScore.signals.map(s => s.name),
  ]);

  for (const name of allNames) {
    const bSignal = bottomMap.get(name);
    const tSignal = topMap.get(name);
    const value = bSignal?.value ?? tSignal?.value ?? 0;
    const bTier = bSignal?.tier ?? '-';
    const tTier = tSignal?.tier ?? '-';

    // Use the more extreme tier for visual
    const activeTier = (bSignal?.tier === 'STRONG' || bSignal?.tier === 'EXTREME')
      ? bSignal!.tier
      : (tSignal?.tier === 'STRONG' || tSignal?.tier === 'EXTREME')
        ? tSignal!.tier
        : 'NORMAL';

    lines.push(`  ${padRight(name, 24)} ${formatRatio(value, 3).padStart(10)} ${padRight(bTier, 10)} ${padRight(tTier, 10)} ${tierEmoji(activeTier)}`);
  }
  lines.push('');

  // --- Score Summary ---
  lines.push('  SCORE SUMMARY');
  lines.push(thinSep);
  lines.push(`  Bottom Score:  ${risk.bottomScore.score}/${risk.bottomScore.maxScore}  ${'█'.repeat(risk.bottomScore.score)}${'░'.repeat(risk.bottomScore.maxScore - risk.bottomScore.score)}`);
  lines.push(`  Top Score:     ${risk.topScore.score}/${risk.topScore.maxScore}  ${'█'.repeat(risk.topScore.score)}${'░'.repeat(risk.topScore.maxScore - risk.topScore.score)}`);
  lines.push(`  Risk Level:    ${risk.level}`);
  lines.push(`  Urgency:       ${risk.urgency}`);
  lines.push(`  Action:        ${risk.suggestedAction}`);
  lines.push(`  SOL Exposure:  ${risk.exposurePercent}%`);
  lines.push('');

  // --- Convergences ---
  if (risk.bottomScore.convergences.length > 0 || risk.topScore.convergences.length > 0) {
    lines.push('  CONVERGENCES DETECTED');
    lines.push(thinSep);
    for (const c of risk.bottomScore.convergences) lines.push(`  [BOTTOM] ${c}`);
    for (const c of risk.topScore.convergences)    lines.push(`  [TOP]    ${c}`);
    lines.push('');
  }

  // --- Rationale ---
  lines.push('  RATIONALE');
  lines.push(thinSep);
  for (const r of risk.rationale) {
    lines.push(`  ${r}`);
  }
  lines.push('');

  // --- Price Triggers ---
  if (risk.priceTriggers.length > 0) {
    lines.push('  PRICE TRIGGERS');
    lines.push(thinSep);
    for (const t of risk.priceTriggers) {
      const dist = ((t.price - indicators.btcPrice) / indicators.btcPrice * 100);
      const dir = t.direction === 'above' ? 'UP  ' : 'DOWN';
      lines.push(`  ${dir} ${formatUSD(t.price).padStart(12)}  (${formatPercent(dist).padStart(8)})  ${t.label}`);
    }
    lines.push('');
  }

  // --- Loan Warnings ---
  if (loanWarnings.length > 0) {
    lines.push('  LOAN MANAGEMENT');
    lines.push(thinSep);
    for (const w of loanWarnings) {
      const icon = w.severity === 'DANGER' ? '!!!' : w.severity === 'WARNING' ? '! ' : 'i ';
      lines.push(`  [${icon}] ${w.message}`);
    }
    lines.push('');
  }

  // --- Trade Result ---
  if (tradeResult) {
    lines.push('  TRADE EXECUTION');
    lines.push(thinSep);
    if (tradeResult.success) {
      lines.push(`  Status:     SUCCESS`);
      lines.push(`  TX:         ${tradeResult.txSignature}`);
      lines.push(`  Input:      ${formatSOL(tradeResult.inputAmount)}`);
      lines.push(`  Output:     ${formatUSDC(tradeResult.outputAmount)}`);
      lines.push(`  Price:      ${tradeResult.price}`);
    } else {
      lines.push(`  Status:     FAILED`);
      lines.push(`  Error:      ${tradeResult.error}`);
    }
    lines.push('');
  }

  lines.push(sep);
  lines.push('  Aquiles v1.0 - BTC On-Chain Intelligence for Solana Exposure Management');
  lines.push(sep);

  return lines.join('\n');
}
