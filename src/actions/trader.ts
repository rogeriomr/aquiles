import { TradeAction, TradeResult, RiskAssessment, AgentConfig } from '../types';
import { SOL_MINT, USDC_MINT, LAMPORTS_PER_SOL } from '../config';
import * as jupiter from '../integrations/jupiter';
import * as solana from '../integrations/solana';
import { logger } from '../utils/logger';

export function buildTradeAction(
  risk: RiskAssessment,
  solBalanceLamports: number,
  usdcBalanceRaw: number,
  solPrice: number,
  config: AgentConfig
): TradeAction | null {
  const { suggestedAction, exposurePercent } = risk;

  if (suggestedAction === 'HOLD') {
    logger.info('No trade needed - HOLD signal');
    return null;
  }

  // Calculate current portfolio value
  const solValueUsd = (solBalanceLamports / LAMPORTS_PER_SOL) * solPrice;
  const usdcValueUsd = usdcBalanceRaw / 1_000_000;
  const totalValueUsd = solValueUsd + usdcValueUsd;

  if (totalValueUsd < 1) {
    logger.warn('Portfolio value too low to trade');
    return null;
  }

  const currentSolPercent = (solValueUsd / totalValueUsd) * 100;
  const targetSolPercent = exposurePercent;
  const deltaPercent = targetSolPercent - currentSolPercent;

  // Skip if delta is too small (< 5%)
  if (Math.abs(deltaPercent) < 5) {
    logger.info(`Delta too small (${deltaPercent.toFixed(1)}%). No trade needed.`);
    return null;
  }

  // Cap trade size
  const maxDelta = config.maxTradePercent;
  const cappedDelta = Math.min(Math.abs(deltaPercent), maxDelta);

  if (suggestedAction === 'BUY_SOL') {
    // Buy SOL with USDC
    const usdcToSpend = Math.floor((cappedDelta / 100) * totalValueUsd * 1_000_000); // in USDC raw units
    const available = usdcBalanceRaw;
    const amount = Math.min(usdcToSpend, available);

    if (amount < 100_000) { // < 0.1 USDC
      logger.warn('Insufficient USDC to buy SOL');
      return null;
    }

    return {
      direction: 'BUY_SOL',
      percent: cappedDelta,
      inputMint: USDC_MINT,
      outputMint: SOL_MINT,
      amount,
      slippageBps: config.maxSlippageBps,
    };
  }

  if (suggestedAction === 'SELL_SOL') {
    // Sell SOL for USDC
    const solToSell = Math.floor((cappedDelta / 100) * totalValueUsd / solPrice * LAMPORTS_PER_SOL);
    const available = solBalanceLamports - 50_000_000; // keep 0.05 SOL for fees
    const amount = Math.min(solToSell, Math.max(0, available));

    if (amount < 1_000_000) { // < 0.001 SOL
      logger.warn('Insufficient SOL to sell');
      return null;
    }

    return {
      direction: 'SELL_SOL',
      percent: cappedDelta,
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amount,
      slippageBps: config.maxSlippageBps,
    };
  }

  return null;
}

export async function executeTrade(
  action: TradeAction,
  config: AgentConfig
): Promise<TradeResult> {
  logger.trade(`Executing ${action.direction}: amount=${action.amount} (${action.percent.toFixed(1)}%)`);

  if (!config.walletPrivateKey) {
    return {
      success: false,
      inputAmount: action.amount,
      outputAmount: 0,
      price: 0,
      error: 'No wallet private key configured. Set WALLET_PRIVATE_KEY in .env',
    };
  }

  try {
    // 1. Get Jupiter quote
    const quote = await jupiter.getQuote(
      action.inputMint,
      action.outputMint,
      action.amount,
      action.slippageBps,
      config.jupiterApiUrl
    );

    // Check price impact
    const priceImpact = parseFloat(quote.priceImpactPct);
    const inAmt = parseInt(quote.inAmount) || 1; // guard against division by zero
    if (priceImpact > 2) {
      return {
        success: false,
        inputAmount: parseInt(quote.inAmount),
        outputAmount: parseInt(quote.outAmount),
        price: parseInt(quote.outAmount) / inAmt,
        error: `Price impact too high: ${priceImpact}%`,
      };
    }

    // 2. Build swap transaction
    const publicKey = solana.getPublicKey(config.walletPrivateKey);
    const swapResponse = await jupiter.getSwapTransaction(quote, publicKey, config.jupiterApiUrl);

    // 3. Sign and send
    const txSignature = await solana.sendVersionedTransaction(
      config.rpcUrl,
      config.walletPrivateKey,
      swapResponse.swapTransaction
    );

    logger.trade(`Trade executed successfully: ${txSignature}`);

    return {
      success: true,
      txSignature,
      inputAmount: parseInt(quote.inAmount),
      outputAmount: parseInt(quote.outAmount),
      price: parseInt(quote.outAmount) / inAmt,
    };
  } catch (error: any) {
    logger.error(`Trade execution failed: ${error.message}`);
    return {
      success: false,
      inputAmount: action.amount,
      outputAmount: 0,
      price: 0,
      error: error.message,
    };
  }
}
