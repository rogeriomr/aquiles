import { loadConfig } from './config';
import { loadIndicators } from './perception/btc-onchain';
import { getSolPrice, getSolBalance, getUsdcBalance } from './perception/sol-market';
import { getLendingPositions } from './perception/lending';
import { detectBottom } from './analysis/bottom-detector';
import { detectTop } from './analysis/top-detector';
import { assessRisk } from './analysis/risk-engine';
import { assessLoanRisk } from './analysis/loan-advisor';
import { generateAlert } from './actions/alerter';
import { generateFullReport } from './actions/reporter';
import { buildTradeAction, executeTrade } from './actions/trader';
import { getPublicKey } from './integrations/solana';
import { logger } from './utils/logger';
import { AgentConfig, OnChainIndicators, TradeResult } from './types';

export async function runAgent(configOverride?: Partial<AgentConfig>): Promise<void> {
  logger.info('=== AQUILES AGENT STARTING ===');
  logger.info('BTC On-Chain Intelligence for Solana Exposure Management');
  logger.info('');

  // 1. Load config
  const config = { ...loadConfig(), ...configOverride };
  logger.info(`Mode: ${config.mode.toUpperCase()}`);

  // 2. Load BTC on-chain indicators
  let indicators: OnChainIndicators;
  try {
    indicators = await loadIndicators();
  } catch (error: any) {
    logger.error(`Failed to load indicators: ${error.message}`);
    throw error;
  }

  // 3. Run analysis
  logger.info('Running analysis...');
  const bottomScore = detectBottom(indicators);
  const topScore = detectTop(indicators);
  const risk = assessRisk(indicators, bottomScore, topScore);

  logger.signal(`Bottom: ${bottomScore.score}/${bottomScore.maxScore} | Top: ${topScore.score}/${topScore.maxScore} | Level: ${risk.level}`);

  // 4. Check lending positions
  let loanWarnings = assessLoanRisk(risk, []);
  if (config.walletPrivateKey) {
    try {
      const walletAddress = getPublicKey(config.walletPrivateKey);
      const positions = await getLendingPositions(config.rpcUrl, walletAddress);
      if (positions.length > 0) {
        loanWarnings = assessLoanRisk(risk, positions);
      }
    } catch (e: any) {
      logger.warn(`Lending check skipped: ${e.message}`);
    }
  }

  // 5. Execute based on mode
  let tradeResult: TradeResult | undefined;

  if (config.mode === 'auto' && config.walletPrivateKey) {
    logger.info('AUTO MODE: Checking for trade opportunities...');

    try {
      const walletAddress = getPublicKey(config.walletPrivateKey);
      const [solBalance, usdcBalance, solPrice] = await Promise.all([
        getSolBalance(config.rpcUrl, walletAddress),
        getUsdcBalance(config.rpcUrl, walletAddress),
        getSolPrice(),
      ]);

      const action = buildTradeAction(risk, solBalance, usdcBalance, solPrice, config);

      if (action) {
        logger.trade(`Trade action: ${action.direction} ${action.percent.toFixed(1)}%`);
        tradeResult = await executeTrade(action, config);
      } else {
        logger.info('No trade action needed at this time');
      }
    } catch (e: any) {
      logger.error(`Auto mode error: ${e.message}`);
    }
  } else if (config.mode === 'alert') {
    logger.info('ALERT MODE: Generating analysis report...');
    const alert = generateAlert(risk, loanWarnings, indicators);
    console.log(alert.report);
  } else if (config.mode === 'auto' && !config.walletPrivateKey) {
    logger.warn('AUTO MODE requires WALLET_PRIVATE_KEY. Falling back to ALERT mode.');
    const alert = generateAlert(risk, loanWarnings, indicators);
    console.log(alert.report);
  }

  // 6. Generate full report (available for programmatic use)
  const fullReport = generateFullReport(indicators, risk, loanWarnings, tradeResult);
  logger.info('Full report generated.');

  logger.info('=== AQUILES AGENT CYCLE COMPLETE ===');
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] as 'auto' | 'alert' : undefined;

  runAgent(mode ? { mode } : undefined).catch(err => {
    logger.error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}
