import * as dotenv from 'dotenv';
import { AgentConfig, AgentMode } from './types';

dotenv.config();

// Solana token mints
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Lamports
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const USDC_DECIMALS = 6;

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
  0: 0, 1: 15, 2: 30, 3: 50, 4: 70, 5: 85, 6: 100,
};

export function loadConfig(): AgentConfig {
  return {
    mode: (process.env.AGENT_MODE as AgentMode) || 'alert',
    rpcUrl: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
    jupiterApiUrl: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    colosseumApiKey: process.env.COLOSSEUM_API_KEY,
    colosseumAgentId: process.env.COLOSSEUM_AGENT_ID ? parseInt(process.env.COLOSSEUM_AGENT_ID) : 3860,
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '100'),
    maxTradePercent: parseInt(process.env.MAX_TRADE_PERCENT || '100'),
    loopIntervalMinutes: parseInt(process.env.LOOP_INTERVAL_MINUTES || '30'),
  };
}
