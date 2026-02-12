import * as dotenv from 'dotenv';
import { AgentConfig, AgentMode } from './types';

dotenv.config();

// Solana token mints
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Lamports
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Default thresholds for bottom detection
export const BOTTOM_THRESHOLDS = {
  mvrv:             { watch: 1.0,  strong: 0.8,  extreme: 0.6  },
  sthMvrv:          { watch: 0.9,  strong: 0.8,  extreme: 0.6  },
  mayerMultiple:    { watch: 0.8,  strong: 0.7,  extreme: 0.5  },
  realizedPriceRatio: { watch: 1.1, strong: 1.05, extreme: 1.0 },
  lthSopr:          { watch: 0.95, strong: 0.85, extreme: 0.75 },
  avivRatio:        { watch: 0.9,  strong: 0.8,  extreme: 0.6  },
  cvddRatio:        { watch: 1.5,  strong: 1.2,  extreme: 1.0  },
  terminalPriceRatio: { watch: 0.3, strong: 0.2, extreme: 0.15 },
};

// Default thresholds for top detection
export const TOP_THRESHOLDS = {
  mvrv:             { watch: 2.5,  strong: 3.0,  extreme: 3.5  },
  sthMvrv:          { watch: 1.3,  strong: 1.5,  extreme: 1.8  },
  mayerMultiple:    { watch: 1.5,  strong: 2.0,  extreme: 2.4  },
  lthMvrv:          { watch: 3.0,  strong: 3.5,  extreme: 4.0  },
  avivRatio:        { watch: 1.5,  strong: 2.0,  extreme: 2.5  },
  terminalPriceRatio: { watch: 0.7, strong: 0.8, extreme: 0.9 },
};

// Exposure % based on score
export const BOTTOM_EXPOSURE_MAP: Record<number, number> = {
  0: 0, 1: 15, 2: 25, 3: 40, 4: 50, 5: 65, 6: 75, 7: 90, 8: 100,
};

export const TOP_EXPOSURE_MAP: Record<number, number> = {
  0: 0, 1: 10, 2: 20, 3: 30, 4: 40, 5: 45, 6: 50,
};

export function loadConfig(): AgentConfig {
  // Validate mode
  const rawMode = process.env.AGENT_MODE;
  const mode: AgentMode = (rawMode === 'auto' || rawMode === 'alert') ? rawMode : 'alert';

  // Parse with NaN guards (fall back to defaults if NaN)
  const parsedColosseumAgentId = parseInt(process.env.COLOSSEUM_AGENT_ID || '');
  const parsedSlippage = parseInt(process.env.MAX_SLIPPAGE_BPS || '100');
  const parsedTradePercent = parseInt(process.env.MAX_TRADE_PERCENT || '100');
  const parsedLoopInterval = parseInt(process.env.LOOP_INTERVAL_MINUTES || '30');

  // Clamp maxSlippageBps between 1 and 500 (max 5%)
  const maxSlippageBps = isNaN(parsedSlippage)
    ? 100
    : Math.max(1, Math.min(500, parsedSlippage));

  // Clamp maxTradePercent between 1 and 100
  const maxTradePercent = isNaN(parsedTradePercent)
    ? 100
    : Math.max(1, Math.min(100, parsedTradePercent));

  // Minimum loopIntervalMinutes is 1
  const loopIntervalMinutes = isNaN(parsedLoopInterval)
    ? 30
    : Math.max(1, parsedLoopInterval);

  return {
    mode,
    rpcUrl: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
    jupiterApiUrl: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    colosseumApiKey: process.env.COLOSSEUM_API_KEY,
    colosseumAgentId: isNaN(parsedColosseumAgentId) ? 3860 : parsedColosseumAgentId,
    maxSlippageBps,
    maxTradePercent,
    loopIntervalMinutes,
  };
}
