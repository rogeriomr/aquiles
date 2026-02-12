import * as fs from 'fs';
import * as path from 'path';
import { OnChainIndicators } from '../types';
import { fetchWithTimeout } from '../utils/fetch';
import { logger } from '../utils/logger';

const BASE_URL = 'https://api.researchbitcoin.net/v2';
const CACHE_PATH = path.join(process.cwd(), 'data', 'indicators.json');

function getApiToken(): string {
  const token = process.env.BITCOIN_LAB_API_TOKEN;
  if (!token) {
    throw new Error('BITCOIN_LAB_API_TOKEN not set in environment');
  }
  return token;
}

// --- Low-level API helpers ---

interface ApiJsonResponse {
  status: string;
  data: Array<Record<string, number | string>>;
  message?: string;
  payload?: number;
}

async function fetchMetric(endpoint: string, params: Record<string, string> = {}, retries = 3): Promise<ApiJsonResponse> {
  const token = getApiToken();
  const query = new URLSearchParams({ output_format: 'json', ...params });
  const url = `${BASE_URL}/${endpoint}?${query}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetchWithTimeout(url, {
      headers: { 'X-API-Token': token },
    }, 30000);

    if (res.status === 401) throw new Error(`Bitcoin LAB API: unauthorized (check BITCOIN_LAB_API_TOKEN)`);
    if (res.status === 402) throw new Error(`Bitcoin LAB API: payment required (quota exceeded)`);

    if (res.status === 429 || res.status === 503) {
      if (attempt < retries) {
        const delay = attempt * 2000;
        logger.warn(`Bitcoin LAB API: HTTP ${res.status} for ${endpoint}, retrying in ${delay / 1000}s (${attempt}/${retries})...`);
        await sleep(delay);
        continue;
      }
      throw new Error(`Bitcoin LAB API: HTTP ${res.status} for ${endpoint} after ${retries} attempts`);
    }

    if (!res.ok) throw new Error(`Bitcoin LAB API: HTTP ${res.status} for ${endpoint}`);

    return res.json() as Promise<ApiJsonResponse>;
  }

  throw new Error(`Bitcoin LAB API: unreachable for ${endpoint}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function latestValue(data: ApiJsonResponse, field: string): number {
  if (!data.data || data.data.length === 0) {
    throw new Error(`Bitcoin LAB API: no data returned for field "${field}"`);
  }
  const last = data.data[data.data.length - 1];
  const val = last[field];
  if (val === undefined || val === null) {
    throw new Error(`Bitcoin LAB API: field "${field}" not found in response. Available: ${Object.keys(last).join(', ')}`);
  }
  return Number(val);
}

function allValues(data: ApiJsonResponse, field: string): number[] {
  return data.data.map(row => Number(row[field])).filter(v => isFinite(v));
}

// --- Date helpers ---

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Metric fetchers ---

async function fetchLatestMetric(endpoint: string, field: string): Promise<number> {
  const data = await fetchMetric(endpoint, {
    resolution: 'd1',
    from_time: daysAgo(3),
    to_time: today(),
  });
  return latestValue(data, field);
}

async function computeSma200(): Promise<number> {
  logger.info('Bitcoin LAB: fetching 200 days of price data for SMA200...');
  const data = await fetchMetric('price/price', {
    resolution: 'd1',
    from_time: daysAgo(210),
    to_time: today(),
  });
  const prices = allValues(data, 'price');
  if (prices.length < 200) {
    logger.warn(`Bitcoin LAB: only ${prices.length} price points (need 200). Using available data.`);
  }
  const last200 = prices.slice(-200);
  return last200.reduce((sum, p) => sum + p, 0) / last200.length;
}

/** Read cached value from indicators.json for fields the API can't compute */
function getCachedValue(field: string): number {
  if (!fs.existsSync(CACHE_PATH)) {
    throw new Error(`No cached indicators at ${CACHE_PATH} — needed for ${field}`);
  }
  const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
  const cached = JSON.parse(raw);
  const val = cached[field];
  if (typeof val !== 'number' || !isFinite(val)) {
    throw new Error(`Cached value for ${field} is invalid: ${val}`);
  }
  return val;
}

// --- Main entry point ---

export async function fetchIndicatorsFromApi(): Promise<OnChainIndicators> {
  logger.info('Bitcoin LAB: fetching on-chain indicators from API...');

  // Terminal Price and CVDD Floor require full historical data that the API
  // doesn't provide in a single endpoint. Use cached values from indicators.json
  // and update them only when manually refreshed from CheckOnChain/LookIntoBitcoin.
  let terminalPrice: number;
  let cvddFloor: number;
  try {
    terminalPrice = getCachedValue('terminalPrice');
    cvddFloor = getCachedValue('cvddFloor');
    logger.info(`Bitcoin LAB: using cached Terminal Price ($${terminalPrice.toLocaleString()}) and CVDD Floor ($${cvddFloor.toLocaleString()})`);
  } catch (err: any) {
    throw new Error(`Cannot proceed without Terminal Price and CVDD Floor: ${err.message}`);
  }

  // Batch 1: Price, realized prices, SMA200 (SMA200 fetches 200+ data points)
  const [btcPrice, realizedPrice, sthCostBasis, sma200] = await Promise.all([
    fetchLatestMetric('price/price', 'price'),
    fetchLatestMetric('realizedprice/realized_price', 'realized_price'),
    fetchLatestMetric('realizedprice/realized_price_sth', 'realized_price_sth'),
    computeSma200(),
  ]);

  // Batch 2: MVRV ratios + cointime metrics
  const [mvrv, sthMvrv, lthMvrv, trueMarketMean, avivRatio] = await Promise.all([
    fetchLatestMetric('market_value_to_realized_value/mvrv', 'mvrv'),
    fetchLatestMetric('market_value_to_realized_value/mvrv_sth', 'mvrv_sth'),
    fetchLatestMetric('market_value_to_realized_value/mvrv_lth', 'mvrv_lth'),
    fetchLatestMetric('cointime_statistics/true_market_meanprice', 'true_market_meanprice'),
    fetchLatestMetric('cointime_statistics/active_value_to_investor_value', 'active_value_to_investor_value'),
  ]);

  // Batch 3: LTH SOPR (single request to avoid rate limits)
  const lthSopr = await fetchLatestMetric('spent_output_profit_ratio/sopr_lth', 'sopr_lth');

  // Compute derived ratios
  const mayerMultiple = btcPrice / sma200;
  const realizedPriceRatio = btcPrice / realizedPrice;
  const cvddRatio = btcPrice / cvddFloor;
  const terminalPriceRatio = btcPrice / terminalPrice;

  const indicators: OnChainIndicators = {
    timestamp: new Date().toISOString(),
    btcPrice: round(btcPrice, 2),
    realizedPrice: round(realizedPrice, 2),
    sthCostBasis: round(sthCostBasis, 2),
    sma200: round(sma200, 2),
    trueMarketMean: round(trueMarketMean, 2),
    cvddFloor: round(cvddFloor, 2),
    terminalPrice: round(terminalPrice, 2),
    mvrv: round(mvrv, 4),
    sthMvrv: round(sthMvrv, 4),
    lthMvrv: round(lthMvrv, 4),
    mayerMultiple: round(mayerMultiple, 4),
    realizedPriceRatio: round(realizedPriceRatio, 4),
    lthSopr: round(lthSopr, 4),
    avivRatio: round(avivRatio, 4),
    cvddRatio: round(cvddRatio, 4),
    terminalPriceRatio: round(terminalPriceRatio, 4),
  };

  logger.success(`Bitcoin LAB: all 17 indicators loaded (BTC: $${indicators.btcPrice.toLocaleString()}, MVRV: ${indicators.mvrv})`);
  return indicators;
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
