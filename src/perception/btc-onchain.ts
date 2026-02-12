import * as fs from 'fs';
import * as path from 'path';
import { OnChainIndicators } from '../types';
import { logger } from '../utils/logger';

const DATA_PATH = path.join(process.cwd(), 'data', 'indicators.json');

export function loadIndicatorsFromFile(filePath?: string): OnChainIndicators {
  const p = filePath || DATA_PATH;
  logger.info(`Loading BTC on-chain indicators from ${p}`);

  if (!fs.existsSync(p)) {
    throw new Error(`Indicators file not found: ${p}. Please create data/indicators.json with current BTC on-chain data.`);
  }

  const raw = fs.readFileSync(p, 'utf-8');
  const data = JSON.parse(raw) as OnChainIndicators;

  // Validate required fields
  const required: (keyof OnChainIndicators)[] = [
    'btcPrice', 'mvrv', 'sthMvrv', 'lthMvrv', 'mayerMultiple',
    'realizedPriceRatio', 'lthSopr', 'avivRatio', 'cvddRatio', 'terminalPriceRatio',
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required indicator: ${field} in ${p}`);
    }
  }

  logger.success(`Loaded ${Object.keys(data).length} indicators (BTC price: $${data.btcPrice.toLocaleString()})`);
  return data;
}

export async function loadIndicators(filePath?: string): Promise<OnChainIndicators> {
  return loadIndicatorsFromFile(filePath);
}
