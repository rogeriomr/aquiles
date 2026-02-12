import {
  RiskAssessment, Alert, AlertSignal, AlertSeverity,
  LoanWarning, OnChainIndicators,
} from '../types';

function determineAlertSignal(risk: RiskAssessment): AlertSignal {
  const { level, bottomScore, topScore } = risk;

  if (level === 'ACUMULAR') {
    if (bottomScore.score >= 5) return 'COMPRA FORTE';
    if (bottomScore.score >= 2) return 'ACUMULACAO';
    return 'ATENCAO';
  }

  if (level === 'DISTRIBUIR') {
    if (topScore.score >= 4) return 'VENDA FORTE';
    if (topScore.score >= 2) return 'DISTRIBUICAO';
    return 'ATENCAO';
  }

  if (level === 'INCERTEZA') return 'ATENCAO';
  return 'NEUTRO';
}

function determineAlertSeverity(risk: RiskAssessment): AlertSeverity {
  if (risk.urgency === 'CRITICAL') return 'DANGER';
  if (risk.urgency === 'HIGH') return 'WARNING';
  if (risk.level === 'ACUMULAR' && risk.bottomScore.score >= 3) return 'OPPORTUNITY';
  return 'INFO';
}

export function generateAlert(
  risk: RiskAssessment,
  loanWarnings: LoanWarning[],
  indicators: OnChainIndicators
): Alert {
  const signal = determineAlertSignal(risk);
  const severity = determineAlertSeverity(risk);

  // Build formatted report
  const lines: string[] = [];
  const sep = '='.repeat(70);
  const thinSep = '-'.repeat(70);

  lines.push('');
  lines.push(sep);
  lines.push(`  AQUILES - BTC ON-CHAIN INTELLIGENCE REPORT`);
  lines.push(`  ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`);
  lines.push(sep);
  lines.push('');

  // Signal headline
  const signalLabel = `>>> ${signal} <<<`;
  lines.push(`  SIGNAL: ${signalLabel}`);
  lines.push(`  Risk Level: ${risk.level} | Urgency: ${risk.urgency}`);
  lines.push(`  BTC Price: $${indicators.btcPrice.toLocaleString()}`);
  lines.push('');

  // Bottom score
  lines.push(thinSep);
  lines.push(`  BOTTOM SIGNALS: ${risk.bottomScore.score}/${risk.bottomScore.maxScore}`);
  lines.push(thinSep);
  for (const s of risk.bottomScore.signals) {
    const marker = (s.tier === 'STRONG' || s.tier === 'EXTREME') ? '[X]' : '[ ]';
    const tierTag = s.tier.padEnd(7);
    lines.push(`  ${marker} ${s.name.padEnd(22)} ${s.value.toFixed(3).padStart(8)}  ${tierTag}  ${s.description}`);
  }
  if (risk.bottomScore.convergences.length > 0) {
    lines.push('');
    lines.push('  Convergences:');
    for (const c of risk.bottomScore.convergences) {
      lines.push(`    * ${c}`);
    }
  }
  lines.push('');

  // Top score
  lines.push(thinSep);
  lines.push(`  TOP SIGNALS: ${risk.topScore.score}/${risk.topScore.maxScore}`);
  lines.push(thinSep);
  for (const s of risk.topScore.signals) {
    const marker = (s.tier === 'STRONG' || s.tier === 'EXTREME') ? '[X]' : '[ ]';
    const tierTag = s.tier.padEnd(7);
    lines.push(`  ${marker} ${s.name.padEnd(22)} ${s.value.toFixed(3).padStart(8)}  ${tierTag}  ${s.description}`);
  }
  if (risk.topScore.convergences.length > 0) {
    lines.push('');
    lines.push('  Convergences:');
    for (const c of risk.topScore.convergences) {
      lines.push(`    * ${c}`);
    }
  }
  lines.push('');

  // Recommendation
  lines.push(thinSep);
  lines.push(`  RECOMMENDATION`);
  lines.push(thinSep);
  lines.push(`  Action: ${risk.suggestedAction}`);
  lines.push(`  Recommended SOL Exposure: ${risk.exposurePercent}%`);
  lines.push('');
  for (const r of risk.rationale) {
    lines.push(`  ${r}`);
  }
  lines.push('');

  // Price triggers
  if (risk.priceTriggers.length > 0) {
    lines.push(thinSep);
    lines.push(`  PRICE TRIGGERS (next level changes)`);
    lines.push(thinSep);
    for (const t of risk.priceTriggers.slice(0, 8)) {
      const dist = ((t.price - indicators.btcPrice) / indicators.btcPrice * 100).toFixed(1);
      const dir = t.direction === 'above' ? 'UP' : 'DN';
      lines.push(`  ${dir} $${t.price.toLocaleString().padStart(10)}  (${dist.padStart(6)}%)  ${t.label}`);
    }
    lines.push('');
  }

  // Lending management
  if (loanWarnings.length > 0) {
    lines.push(thinSep);
    lines.push(`  DEFI LENDING MANAGEMENT (Kamino / Jupiter)`);
    lines.push(thinSep);
    lines.push('');
    lines.push('  The Achilles\' heel of investors: leveraging in euphoria, deleveraging at the bottom.');
    lines.push('  On-chain data helps break this cycle with objective, historically-proven signals.');
    lines.push('');
    for (const w of loanWarnings) {
      const icon = w.severity === 'DANGER' ? '[!!!]'
        : w.severity === 'OPPORTUNITY' ? '[ $ ]'
        : w.severity === 'WARNING' ? '[!! ]'
        : '[ i ]';
      lines.push(`  ${icon} ${w.message}`);
    }
    lines.push('');
  }

  lines.push(sep);
  lines.push(`  Powered by Aquiles - BTC On-Chain Intelligence for Solana`);
  lines.push(sep);
  lines.push('');

  const report = lines.join('\n');

  return {
    signal,
    severity,
    riskAssessment: risk,
    loanWarnings,
    report,
    timestamp: new Date().toISOString(),
  };
}
