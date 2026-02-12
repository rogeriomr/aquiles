export interface BacktestPoint {
  date: string;
  btcPrice: number;
  mvrv: number;
  signal: 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL';
  bottomScore: number;
  topScore: number;
}

// Key historical data points with linear interpolation for intermediate months
const keyPoints: BacktestPoint[] = [
  { date: '2015-01', btcPrice: 200, mvrv: 0.50, signal: 'ACCUMULATE', bottomScore: 7, topScore: 0 },
  { date: '2015-06', btcPrice: 250, mvrv: 0.65, signal: 'ACCUMULATE', bottomScore: 5, topScore: 0 },
  { date: '2015-12', btcPrice: 430, mvrv: 1.00, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2016-06', btcPrice: 650, mvrv: 1.30, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2016-12', btcPrice: 950, mvrv: 1.50, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2017-06', btcPrice: 2500, mvrv: 2.20, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2017-11', btcPrice: 10000, mvrv: 3.20, signal: 'DISTRIBUTE', bottomScore: 0, topScore: 3 },
  { date: '2017-12', btcPrice: 19000, mvrv: 4.50, signal: 'DISTRIBUTE', bottomScore: 0, topScore: 6 },
  { date: '2018-03', btcPrice: 8500, mvrv: 2.00, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2018-09', btcPrice: 6500, mvrv: 1.00, signal: 'NEUTRAL', bottomScore: 1, topScore: 0 },
  { date: '2018-12', btcPrice: 3200, mvrv: 0.70, signal: 'ACCUMULATE', bottomScore: 7, topScore: 0 },
  { date: '2019-03', btcPrice: 4000, mvrv: 0.85, signal: 'ACCUMULATE', bottomScore: 4, topScore: 0 },
  { date: '2019-06', btcPrice: 11000, mvrv: 2.00, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2019-09', btcPrice: 8300, mvrv: 1.50, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2019-12', btcPrice: 7200, mvrv: 1.30, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2020-03', btcPrice: 5000, mvrv: 0.80, signal: 'ACCUMULATE', bottomScore: 6, topScore: 0 },
  { date: '2020-06', btcPrice: 9100, mvrv: 1.20, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2020-09', btcPrice: 10800, mvrv: 1.40, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2020-12', btcPrice: 29000, mvrv: 2.50, signal: 'NEUTRAL', bottomScore: 0, topScore: 1 },
  { date: '2021-03', btcPrice: 58000, mvrv: 3.50, signal: 'DISTRIBUTE', bottomScore: 0, topScore: 4 },
  { date: '2021-04', btcPrice: 64000, mvrv: 3.80, signal: 'DISTRIBUTE', bottomScore: 0, topScore: 5 },
  { date: '2021-07', btcPrice: 33000, mvrv: 1.60, signal: 'NEUTRAL', bottomScore: 1, topScore: 0 },
  { date: '2021-09', btcPrice: 43000, mvrv: 2.10, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2021-11', btcPrice: 69000, mvrv: 3.90, signal: 'DISTRIBUTE', bottomScore: 0, topScore: 5 },
  { date: '2022-01', btcPrice: 38000, mvrv: 1.80, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2022-03', btcPrice: 42000, mvrv: 1.90, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2022-06', btcPrice: 20000, mvrv: 0.90, signal: 'ACCUMULATE', bottomScore: 4, topScore: 0 },
  { date: '2022-09', btcPrice: 19000, mvrv: 0.85, signal: 'ACCUMULATE', bottomScore: 5, topScore: 0 },
  { date: '2022-11', btcPrice: 16000, mvrv: 0.75, signal: 'ACCUMULATE', bottomScore: 7, topScore: 0 },
  { date: '2023-01', btcPrice: 23000, mvrv: 1.00, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2023-03', btcPrice: 28000, mvrv: 1.20, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2023-06', btcPrice: 30000, mvrv: 1.30, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2023-09', btcPrice: 27000, mvrv: 1.15, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2023-12', btcPrice: 42000, mvrv: 1.80, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2024-03', btcPrice: 73000, mvrv: 2.60, signal: 'NEUTRAL', bottomScore: 0, topScore: 1 },
  { date: '2024-06', btcPrice: 62000, mvrv: 2.20, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2024-09', btcPrice: 63000, mvrv: 2.10, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2024-12', btcPrice: 95000, mvrv: 2.80, signal: 'NEUTRAL', bottomScore: 0, topScore: 2 },
  { date: '2025-03', btcPrice: 82000, mvrv: 2.30, signal: 'NEUTRAL', bottomScore: 0, topScore: 1 },
  { date: '2025-06', btcPrice: 78000, mvrv: 2.00, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2025-09', btcPrice: 72000, mvrv: 1.60, signal: 'NEUTRAL', bottomScore: 0, topScore: 0 },
  { date: '2025-12', btcPrice: 70000, mvrv: 1.35, signal: 'NEUTRAL', bottomScore: 1, topScore: 0 },
  { date: '2026-02', btcPrice: 68000, mvrv: 1.22, signal: 'ACCUMULATE', bottomScore: 3, topScore: 0 },
];

function parseDate(d: string): { year: number; month: number } {
  const [year, month] = d.split('-').map(Number);
  return { year, month };
}

function monthDiff(a: string, b: string): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return (pb.year - pa.year) * 12 + (pb.month - pa.month);
}

function addMonths(d: string, n: number): string {
  const p = parseDate(d);
  let month = p.month + n;
  let year = p.year;
  while (month > 12) { month -= 12; year++; }
  while (month < 1) { month += 12; year--; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateSignal(prev: BacktestPoint, next: BacktestPoint, t: number): 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL' {
  if (t < 0.5) return prev.signal;
  return next.signal;
}

function generateFullDataset(): BacktestPoint[] {
  const result: BacktestPoint[] = [];

  for (let i = 0; i < keyPoints.length - 1; i++) {
    const curr = keyPoints[i];
    const next = keyPoints[i + 1];
    const gap = monthDiff(curr.date, next.date);

    for (let m = 0; m < gap; m++) {
      const t = gap === 0 ? 0 : m / gap;
      const date = addMonths(curr.date, m);
      result.push({
        date,
        btcPrice: Math.round(lerp(curr.btcPrice, next.btcPrice, t)),
        mvrv: parseFloat(lerp(curr.mvrv, next.mvrv, t).toFixed(2)),
        signal: interpolateSignal(curr, next, t),
        bottomScore: Math.round(lerp(curr.bottomScore, next.bottomScore, t)),
        topScore: Math.round(lerp(curr.topScore, next.topScore, t)),
      });
    }
  }

  // Add the last point
  result.push(keyPoints[keyPoints.length - 1]);

  return result;
}

export const backtestData: BacktestPoint[] = generateFullDataset();

// Performance simulation
export interface PerformancePoint {
  date: string;
  buyAndHold: number;
  aquilesStrategy: number;
}

export function simulatePerformance(): PerformancePoint[] {
  const data = backtestData;
  const initialInvestment = 10000;
  const initialPrice = data[0].btcPrice;

  // Buy & Hold: simply hold BTC from day 1
  const bhBtc = initialInvestment / initialPrice;

  // Aquiles Strategy
  let cashUSD = 0;
  let btcHolding = initialInvestment / initialPrice; // Start fully invested
  let currentAllocation: 'full' | 'half' = 'full';

  const result: PerformancePoint[] = [];

  for (const point of data) {
    const price = point.btcPrice;

    // Check for signal changes
    if (point.signal === 'ACCUMULATE' && currentAllocation !== 'full') {
      // Go 100% BTC: use all cash to buy BTC
      btcHolding += cashUSD / price;
      cashUSD = 0;
      currentAllocation = 'full';
    } else if (point.signal === 'DISTRIBUTE' && currentAllocation !== 'half') {
      // Sell 50%: keep half BTC, convert half to USD
      const totalValue = btcHolding * price + cashUSD;
      cashUSD = totalValue * 0.5;
      btcHolding = (totalValue * 0.5) / price;
      currentAllocation = 'half';
    }
    // NEUTRAL: maintain current allocation

    const buyAndHoldValue = bhBtc * price;
    const aquilesValue = btcHolding * price + cashUSD;

    result.push({
      date: point.date,
      buyAndHold: Math.round(buyAndHoldValue),
      aquilesStrategy: Math.round(aquilesValue),
    });
  }

  return result;
}

export const performanceData: PerformancePoint[] = simulatePerformance();

// Current indicator data
export interface Indicator {
  name: string;
  tier: 'bottom' | 'top';
  active: boolean;
  value: string;
  description: string;
}

export const currentIndicators: Indicator[] = [
  // Bottom indicators (8 total)
  { name: 'MVRV Z-Score', tier: 'bottom', active: true, value: '1.22', description: 'Market value vs realized value ratio below threshold' },
  { name: 'Puell Multiple', tier: 'bottom', active: true, value: '0.6', description: 'Miner revenue relative to 365-day average is low' },
  { name: 'RHODL Ratio', tier: 'bottom', active: false, value: '4200', description: 'Ratio of 1-week to 1-year HODL bands' },
  { name: 'Reserve Risk', tier: 'bottom', active: true, value: '0.002', description: 'Confidence is high relative to price (low risk/reward)' },
  { name: 'Net Unrealized P/L', tier: 'bottom', active: false, value: '0.35', description: 'Network-wide profit/loss status' },
  { name: '200W MA Multiplier', tier: 'bottom', active: false, value: '1.4', description: 'Price relative to 200-week moving average' },
  { name: 'Realized Price', tier: 'bottom', active: false, value: '$31K', description: 'Average cost basis of all BTC' },
  { name: 'Hash Ribbon', tier: 'bottom', active: false, value: 'Neutral', description: 'Miner capitulation signal' },
  // Top indicators (6 total)
  { name: 'Pi Cycle Top', tier: 'top', active: false, value: 'Inactive', description: '111-day and 350-day MA crossover' },
  { name: 'MVRV Z-Score (High)', tier: 'top', active: false, value: '1.22', description: 'MVRV above extreme threshold' },
  { name: 'Terminal Price', tier: 'top', active: false, value: '$180K', description: 'Theoretical cycle ceiling based on transfer price' },
  { name: 'Top Cap Model', tier: 'top', active: false, value: '$200K', description: 'Market cap oscillator peak detection' },
  { name: 'NUPL Euphoria', tier: 'top', active: false, value: '0.35', description: 'Net unrealized profit in euphoria zone' },
  { name: 'Puell Multiple (High)', tier: 'top', active: false, value: '0.6', description: 'Miner revenue extremely elevated' },
];

export const currentBottomScore = 3;
export const currentTopScore = 0;
export const currentSignal: 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL' = 'ACCUMULATE';
