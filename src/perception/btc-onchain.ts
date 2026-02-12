import * as fs from 'fs';
import * as path from 'path';
import { OnChainIndicators } from '../types';
import { logger } from '../utils/logger';
import { fetchIndicatorsFromApi } from './bitcoin-lab';

const DATA_PATH = path.join(process.cwd(), 'data', 'indicators.json');

export function loadIndicatorsFromFile(filePath?: string): OnChainIndicators {
  const p = filePath || DATA_PATH;
  logger.info(`Loading BTC on-chain indicators from ${p}`);

  if (!fs.existsSync(p)) {
    throw new Error(`Indicators file not found: ${p}. Please create data/indicators.json with current BTC on-chain data.`);
  }

  const raw = fs.readFileSync(p, 'utf-8');
  const data = JSON.parse(raw) as OnChainIndicators;

  validateIndicators(data, p);

  logger.success(`Loaded ${Object.keys(data).length} indicators from file (BTC price: $${data.btcPrice.toLocaleString()})`);
  return data;
}

function validateIndicators(data: OnChainIndicators, source: string): void {
  // Validate required fields
  const required: (keyof OnChainIndicators)[] = [
    'btcPrice', 'mvrv', 'sthMvrv', 'lthMvrv', 'mayerMultiple',
    'realizedPriceRatio', 'lthSopr', 'avivRatio', 'cvddRatio', 'terminalPriceRatio',
    'realizedPrice', 'sthCostBasis', 'sma200', 'trueMarketMean', 'cvddFloor', 'terminalPrice',
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required indicator: ${field} in ${source}`);
    }
  }

  // Runtime type validation: ensure every required field is a finite number
  for (const field of required) {
    if (typeof data[field] !== 'number' || !isFinite(data[field] as number)) {
      throw new Error(`Invalid indicator value for ${field}: expected a finite number but got ${data[field]} in ${source}`);
    }
  }

  // Validate btcPrice is positive
  if (data.btcPrice <= 0) {
    throw new Error(`btcPrice must be > 0 but got ${data.btcPrice} in ${source}`);
  }

  // Validate timestamp and check freshness
  if (data.timestamp) {
    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours
    if (isNaN(dataAge)) {
      logger.warn(`Invalid timestamp format: ${data.timestamp}`);
    } else if (dataAge > maxAgeMs) {
      logger.warn(`Indicator data is ${(dataAge / 3600000).toFixed(1)} hours old (source: ${source}).`);
    }
  } else {
    logger.warn('No timestamp in indicator data. Cannot verify freshness.');
  }
}

/** Save fetched indicators to disk as cache for future fallback */
function cacheIndicators(data: OnChainIndicators): void {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Cached indicators to ${DATA_PATH}`);
  } catch (err: any) {
    logger.warn(`Failed to cache indicators: ${err.message}`);
  }
}

export async function loadIndicators(filePath?: string): Promise<OnChainIndicators> {
  // If a specific file path is given, use file mode directly
  if (filePath) {
    return loadIndicatorsFromFile(filePath);
  }

  // Try Bitcoin LAB API first if token is configured
  if (process.env.BITCOIN_LAB_API_TOKEN) {
    try {
      logger.info('Attempting to fetch indicators from Bitcoin LAB API...');
      const data = await fetchIndicatorsFromApi();
      validateIndicators(data, 'Bitcoin LAB API');
      cacheIndicators(data);
      return data;
    } catch (err: any) {
      logger.warn(`Bitcoin LAB API failed: ${err.message}`);
      logger.warn('Falling back to local indicators.json...');
    }
  }

  // Fallback to file
  return loadIndicatorsFromFile();
}
