import { RiskAssessment, LendingPosition, LoanWarning, AlertSeverity } from '../types';

export function assessLoanRisk(
  riskAssessment: RiskAssessment,
  positions: LendingPosition[]
): LoanWarning[] {
  const warnings: LoanWarning[] = [];
  const topScore = riskAssessment.topScore.score;
  const bottomScore = riskAssessment.bottomScore.score;

  // --- General Warnings Based on Cycle Position ---

  if (topScore === 0 && bottomScore >= 3) {
    warnings.push({
      severity: 'INFO',
      message: 'Bottom signals active with no top signals. Relatively safe to hold SOL-collateral positions. Consider increasing exposure.',
    });
  }

  if (topScore >= 1 && topScore < 3) {
    warnings.push({
      severity: 'WARNING',
      message: `${topScore}/6 top indicators active. Exercise caution with new SOL-collateral USD loans. Consider reducing LTV ratios.`,
    });
  }

  if (topScore >= 2) {
    warnings.push({
      severity: 'WARNING',
      message: 'AVOID taking new USD loans with SOL as collateral. Multiple top indicators suggest increased risk of significant drawdown.',
    });
  }

  if (topScore >= 3) {
    warnings.push({
      severity: 'DANGER',
      message: `STRONG TOP SIGNAL (${topScore}/6). Consider repaying existing loans. Historical data shows 50-80% drawdowns from similar indicator levels.`,
    });
  }

  if (topScore >= 5) {
    warnings.push({
      severity: 'DANGER',
      message: 'CRITICAL: REPAY ALL LOANS IMMEDIATELY. Extreme top conditions detected. High probability of cycle top and severe correction.',
    });
  }

  // --- Position-Specific Warnings ---

  for (const position of positions) {
    const distanceToLiquidation = position.liquidationPrice > 0
      ? ((position.currentPrice - position.liquidationPrice) / position.currentPrice) * 100
      : 100;

    if (position.ltv > 80) {
      warnings.push({
        severity: 'DANGER',
        message: `${position.protocol}: LTV at ${position.ltv.toFixed(1)}% - DANGEROUSLY HIGH. Liquidation at $${position.liquidationPrice.toFixed(2)}.`,
        position,
        liquidationDistance: distanceToLiquidation,
      });
    } else if (position.ltv > 65) {
      warnings.push({
        severity: 'WARNING',
        message: `${position.protocol}: LTV at ${position.ltv.toFixed(1)}%. Consider adding collateral or repaying. Liquidation at $${position.liquidationPrice.toFixed(2)}.`,
        position,
        liquidationDistance: distanceToLiquidation,
      });
    } else if (position.ltv > 0) {
      warnings.push({
        severity: 'INFO',
        message: `${position.protocol}: LTV at ${position.ltv.toFixed(1)}%. Healthy. Liquidation at $${position.liquidationPrice.toFixed(2)} (${distanceToLiquidation.toFixed(1)}% away).`,
        position,
        liquidationDistance: distanceToLiquidation,
      });
    }

    // Combined warning: position + top signal
    if (topScore >= 2 && position.ltv > 50) {
      warnings.push({
        severity: 'DANGER',
        message: `${position.protocol}: Top signals active AND LTV at ${position.ltv.toFixed(1)}%. STRONGLY recommend repaying this loan NOW.`,
        position,
        liquidationDistance: distanceToLiquidation,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<AlertSeverity, number> = { DANGER: 0, OPPORTUNITY: 1, WARNING: 2, INFO: 3 };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return warnings;
}
