import { fetchWithTimeout } from '../utils/fetch';
import { ColosseumProject } from '../types';
import { logger } from '../utils/logger';

const COLOSSEUM_API_BASE = 'https://agents.colosseum.com/api';

export async function getAgentStatus(apiKey: string): Promise<any> {
  logger.info('Fetching Colosseum agent status...');
  const res = await fetchWithTimeout(`${COLOSSEUM_API_BASE}/agents/status`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Colosseum status failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  logger.success('Colosseum agent status retrieved');
  return data;
}

export async function createProject(apiKey: string, project: ColosseumProject): Promise<any> {
  logger.info('Creating Colosseum project...');
  const res = await fetchWithTimeout(`${COLOSSEUM_API_BASE}/my-project`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Colosseum create project failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  logger.success('Colosseum project created');
  return data;
}

export async function submitProject(apiKey: string): Promise<any> {
  logger.info('Submitting project to Colosseum hackathon...');
  const res = await fetchWithTimeout(`${COLOSSEUM_API_BASE}/my-project/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Colosseum submit failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  logger.success('Project submitted to Colosseum hackathon!');
  return data;
}

export async function getProject(apiKey: string): Promise<any> {
  logger.info('Fetching Colosseum project...');
  const res = await fetchWithTimeout(`${COLOSSEUM_API_BASE}/my-project`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Colosseum get project failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  logger.success('Colosseum project retrieved');
  return data;
}

export function buildProjectPayload(): ColosseumProject {
  return {
    name: 'Aquiles',
    description: 'Cross-chain intelligence agent: uses Bitcoin on-chain indicators to manage Solana exposure with auto-trading and smart alerts',
    repoLink: 'https://github.com/rogeriomr/aquiles',
    solanaIntegration: 'Jupiter DEX aggregator for automated SOL/USDC swaps based on BTC on-chain risk scores. Monitors Kamino/Marginfi lending positions for liquidation risk alerts. All transactions executed on Solana mainnet.',
    problemStatement: 'Crypto investors lack tools that leverage Bitcoin\'s superior on-chain data to manage altcoin exposure. BTC leads market cycles, yet Solana traders make decisions without this cross-chain intelligence, leading to poor timing on entries/exits and unnecessary liquidations on lending protocols.',
    technicalApproach: 'Perception-Analysis-Action architecture: (1) Ingests 14 BTC on-chain metrics (MVRV, STH/LTH MVRV, Mayer Multiple, AVIV, CVDD, LTH SOPR, Terminal Price, Realized Price). (2) Scores bottom (0-8) and top (0-6) signals with tier-weighted convergence detection. (3) Executes Jupiter swaps or generates detailed alerts with rationale. Includes loan management advisor for Solana lending protocols.',
    targetAudience: 'Solana DeFi users with lending positions who need risk management, SOL holders looking for data-driven entry/exit signals, and crypto funds wanting autonomous portfolio rebalancing based on cycle indicators.',
    businessModel: 'Freemium SaaS: free alert mode with basic indicators, paid tier for auto-trading, full indicator suite, and custom thresholds. Revenue from subscription fees and optional performance-based fees on auto-traded profits.',
    competitiveLandscape: 'DeFi Risk Guardian monitors lending positions but lacks cycle analysis. Trading bots (SIDEX, CrewDegen) use price action, not on-chain fundamentals. No existing agent combines BTC on-chain intelligence with Solana execution. Aquiles fills this gap uniquely.',
    futureVision: 'Expand to multi-chain execution (ETH, ARB), add real-time Glassnode/CryptoQuant API feeds, integrate with more Solana protocols (Drift, Marinade), build Telegram/Discord bot interface, and add backtesting engine to validate signals against historical cycles.',
    tags: ['ai', 'defi', 'trading'],
  };
}
