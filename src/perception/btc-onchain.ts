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
    'realizedPrice', 'sthCostBasis', 'sma200', 'trueMarketMean', 'cvddFloor', 'terminalPrice',
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required indicator: ${field} in ${p}`);
    }
  }

  // Runtime type validation: ensure every required field is a finite number
  for (const field of required) {
    if (typeof data[field] !== 'number' || !isFinite(data[field] as number)) {
      throw new Error(`Invalid indicator value for ${field}: expected a finite number but got ${data[field]} in ${p}`);
    }
  }

  // Validate btcPrice is positive
  if (data.btcPrice <= 0) {
    throw new Error(`btcPrice must be > 0 but got ${data.btcPrice} in ${p}`);
  }

  // Validate timestamp and check freshness
  if (data.timestamp) {
    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours
    if (isNaN(dataAge)) {
      logger.warn(`Invalid timestamp format: ${data.timestamp}`);
    } else if (dataAge > maxAgeMs) {
      logger.warn(`Indicator data is ${(dataAge / 3600000).toFixed(1)} hours old. Consider updating data/indicators.json with fresh data.`);
    }
  } else {
    logger.warn('No timestamp in indicator data. Cannot verify freshness.');
  }

  logger.success(`Loaded ${Object.keys(data).length} indicators (BTC price: $${data.btcPrice.toLocaleString()})`);
  return data;
}

export async function loadIndicators(filePath?: string): Promise<OnChainIndicators> {
  return loadIndicatorsFromFile(filePath);
}
