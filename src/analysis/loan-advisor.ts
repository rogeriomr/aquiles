import { RiskAssessment, LendingPosition, LoanWarning, AlertSeverity } from '../types';
import { calculateLiquidationPrice, calculateLtvAtPrice } from '../perception/lending';

export function assessLoanRisk(
  riskAssessment: RiskAssessment,
  positions: LendingPosition[]
): LoanWarning[] {
  const warnings: LoanWarning[] = [];
  const topScore = riskAssessment.topScore.score;
  const bottomScore = riskAssessment.bottomScore.score;

  // --- General Warnings Based on Cycle Position ---
  // The Achilles' heel of investors: leveraging up during euphoria and deleveraging at the bottom.
  // On-chain data has historically been accurate at identifying these moments across Bitcoin's entire history.

  // BOTTOM ZONE: Safe to take loans -- downside is limited, upside is highest
  if (topScore === 0 && bottomScore >= 5) {
    warnings.push({
      severity: 'OPPORTUNITY',
      message: 'STRONG BOTTOM ZONE: Multiple on-chain indicators confirm historically low levels. This is when DeFi loans on Kamino/Jupiter carry the LEAST risk -- downside is limited and upside potential is highest. Consider opening leveraged positions.',
    });
  } else if (topScore === 0 && bottomScore >= 3) {
    warnings.push({
      severity: 'OPPORTUNITY',
      message: 'Bottom signals active with no top signals. On-chain data suggests favorable conditions for SOL-collateral loans on Kamino/Jupiter. Risk of further drawdown is diminishing.',
    });
  } else if (topScore === 0 && bottomScore >= 1) {
    warnings.push({
      severity: 'INFO',
      message: 'Early bottom signals detected. Safe to hold existing lending positions. Monitor for more confirmations before opening new leveraged positions.',
    });
  }

  // NEUTRAL ZONE
  if (topScore === 0 && bottomScore === 0) {
    warnings.push({
      severity: 'INFO',
      message: 'No strong cycle signals. Maintain existing lending positions but avoid excessive new leverage. Wait for clearer on-chain data.',
    });
  }

  // EARLY WARNING: Top signals starting to appear
  if (topScore >= 1 && topScore < 3) {
    warnings.push({
      severity: 'WARNING',
      message: `${topScore}/6 top indicators active. START PLANNING to deleverage. Reduce LTV ratios on Kamino/Jupiter loans and avoid opening new SOL-collateral borrowing.`,
    });
  }

  // HIGH RISK: Deleverage now
  if (topScore >= 2) {
    warnings.push({
      severity: 'WARNING',
      message: 'AVOID new USD loans with SOL collateral on Kamino/Jupiter. Multiple top indicators suggest increased drawdown risk. History shows this is when leverage destroys portfolios.',
    });
  }

  if (topScore >= 3) {
    warnings.push({
      severity: 'DANGER',
      message: `DELEVERAGE NOW (${topScore}/6 top signals). Repay existing loans on Kamino and Jupiter. Historical data shows 50-80% drawdowns from similar indicator levels -- leveraged positions face liquidation risk.`,
    });
  }

  // CRITICAL: Maximum danger
  if (topScore >= 5) {
    warnings.push({
      severity: 'DANGER',
      message: 'CRITICAL: REPAY ALL DEFI LOANS IMMEDIATELY. Extreme top conditions detected across multiple on-chain metrics. High probability of cycle top and severe correction. Every cycle, leveraged investors get liquidated at this exact stage.',
    });
  }

  // --- Position-Specific Warnings ---

  for (const position of positions) {
    const distanceToLiquidation = position.liquidationPrice > 0
      ? ((position.currentPrice - position.liquidationPrice) / position.currentPrice) * 100
      : 100;

    const calculatedLiqPrice = calculateLiquidationPrice(position);
    const ltvAt20PercentDrop = calculateLtvAtPrice(position, position.currentPrice * 0.8);

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
        message: `${position.protocol}: LTV at ${position.ltv.toFixed(1)}%. Consider adding collateral or repaying. Liquidation at $${position.liquidationPrice.toFixed(2)}. At -20% price: LTV would be ${ltvAt20PercentDrop.toFixed(1)}%.`,
        position,
        liquidationDistance: distanceToLiquidation,
      });
    } else if (position.ltv > 0) {
      warnings.push({
        severity: 'INFO',
        message: `${position.protocol}: LTV at ${position.ltv.toFixed(1)}%. Healthy. Liquidation at $${calculatedLiqPrice.toFixed(2)} (${distanceToLiquidation.toFixed(1)}% away). At -20% price: LTV ${ltvAt20PercentDrop.toFixed(1)}%.`,
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
