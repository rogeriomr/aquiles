// ============================================================
// Aquiles Agent - Analysis Engine Unit Tests
// ============================================================
// Run with: npx ts-node tests/analysis.test.ts

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

import { OnChainIndicators, LendingPosition, BottomScore, TopScore } from '../src/types';
import { detectBottom } from '../src/analysis/bottom-detector';
import { detectTop } from '../src/analysis/top-detector';
import { assessRisk } from '../src/analysis/risk-engine';
import { assessLoanRisk } from '../src/analysis/loan-advisor';
import {
  BOTTOM_THRESHOLDS,
  TOP_THRESHOLDS,
  BOTTOM_EXPOSURE_MAP,
  TOP_EXPOSURE_MAP,
} from '../src/config';

// ============================================================
// Test Helpers
// ============================================================

/** Sensible defaults for OnChainIndicators - all values in "neutral" territory */
function makeIndicators(overrides: Partial<OnChainIndicators> = {}): OnChainIndicators {
  return {
    timestamp: '2026-02-12T14:00:00Z',
    btcPrice: 68040,
    realizedPrice: 55548,
    sthCostBasis: 92000,
    sma200: 101702,
    trueMarketMean: 79124,
    cvddFloor: 46133,
    terminalPrice: 290819,
    // Neutral values - above all bottom watch thresholds, below all top watch thresholds
    mvrv: 1.5,
    sthMvrv: 1.1,
    lthMvrv: 2.0,
    mayerMultiple: 1.0,
    realizedPriceRatio: 1.5,
    lthSopr: 1.1,
    avivRatio: 1.1,
    cvddRatio: 2.0,
    terminalPriceRatio: 0.5,
    ...overrides,
  };
}

/** Load the real indicators.json data */
function loadRealIndicators(): OnChainIndicators {
  const filePath = path.resolve(__dirname, '..', 'data', 'indicators.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as OnChainIndicators;
}

/** Make a mock BottomScore for risk-engine tests */
function makeBottomScore(score: number): BottomScore {
  return {
    score,
    maxScore: 8,
    signals: [],
    convergences: [],
  };
}

/** Make a mock TopScore for risk-engine tests */
function makeTopScore(score: number): TopScore {
  return {
    score,
    maxScore: 6,
    signals: [],
    convergences: [],
  };
}

/** Make a mock LendingPosition */
function makeLendingPosition(overrides: Partial<LendingPosition> = {}): LendingPosition {
  return {
    protocol: 'kamino',
    collateralMint: 'So11111111111111111111111111111111111111112',
    collateralAmount: 100,
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    debtAmount: 5000,
    ltv: 50,
    liquidationPrice: 40,
    currentPrice: 100,
    ...overrides,
  };
}

// ============================================================
// Test Runner
// ============================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: any) {
    failed++;
    const msg = err.message || String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${msg}`);
  }
}

// ============================================================
// 1. Bottom Detector - Real Data
// ============================================================

console.log('\n--- Bottom Detector (real data) ---');

const realIndicators = loadRealIndicators();
const realBottom = detectBottom(realIndicators);

test('real data: bottom score = 3', () => {
  assert.strictEqual(realBottom.score, 3);
});

test('real data: STH MVRV tier = STRONG', () => {
  const sthMvrv = realBottom.signals.find(s => s.name === 'STH MVRV');
  assert.ok(sthMvrv, 'STH MVRV signal not found');
  assert.strictEqual(sthMvrv.tier, 'STRONG');
});

test('real data: Mayer Multiple tier = STRONG', () => {
  const mayer = realBottom.signals.find(s => s.name === 'Mayer Multiple');
  assert.ok(mayer, 'Mayer Multiple signal not found');
  assert.strictEqual(mayer.tier, 'STRONG');
});

test('real data: LTH SOPR tier = STRONG', () => {
  const lthSopr = realBottom.signals.find(s => s.name === 'LTH SOPR');
  assert.ok(lthSopr, 'LTH SOPR signal not found');
  assert.strictEqual(lthSopr.tier, 'STRONG');
});

test('real data: MVRV tier = NORMAL (1.22 is above 1.0 watch threshold)', () => {
  const mvrv = realBottom.signals.find(s => s.name === 'MVRV');
  assert.ok(mvrv, 'MVRV signal not found');
  assert.strictEqual(mvrv.tier, 'NORMAL');
});

test('real data: bottom maxScore = 8', () => {
  assert.strictEqual(realBottom.maxScore, 8);
});

test('real data: bottom has 8 signals total', () => {
  assert.strictEqual(realBottom.signals.length, 8);
});

test('real data: convergence detected for 3+ indicators in bottom zone', () => {
  const hasConvergence = realBottom.convergences.some(c => c.includes('indicators converging in bottom zone'));
  assert.ok(hasConvergence, `Expected convergence message, got: ${JSON.stringify(realBottom.convergences)}`);
});

test('real data: LTH SOPR capitulation convergence detected', () => {
  const hasLthConvergence = realBottom.convergences.some(c => c.includes('LTH SOPR below 1.0'));
  assert.ok(hasLthConvergence, `Expected LTH SOPR convergence message, got: ${JSON.stringify(realBottom.convergences)}`);
});

// ============================================================
// 2. Bottom Detector - Extreme Bottom (all 8 in EXTREME)
// ============================================================

console.log('\n--- Bottom Detector (extreme bottom) ---');

const extremeBottomIndicators = makeIndicators({
  mvrv: 0.5,                // < 0.6 extreme
  sthMvrv: 0.5,             // < 0.6 extreme
  mayerMultiple: 0.4,       // < 0.5 extreme
  realizedPriceRatio: 0.9,  // < 1.0 extreme
  lthSopr: 0.7,             // < 0.75 extreme
  avivRatio: 0.5,           // < 0.6 extreme
  cvddRatio: 0.9,           // < 1.0 extreme
  terminalPriceRatio: 0.1,  // < 0.15 extreme
});

const extremeBottom = detectBottom(extremeBottomIndicators);

test('extreme bottom: score = 8 (all indicators EXTREME)', () => {
  assert.strictEqual(extremeBottom.score, 8);
});

test('extreme bottom: every signal tier is EXTREME', () => {
  for (const signal of extremeBottom.signals) {
    assert.strictEqual(signal.tier, 'EXTREME', `Expected ${signal.name} to be EXTREME, got ${signal.tier}`);
  }
});

test('extreme bottom: convergences include both MVRV and STH MVRV', () => {
  const hasMvrvConvergence = extremeBottom.convergences.some(c => c.includes('Both MVRV and STH MVRV'));
  assert.ok(hasMvrvConvergence, 'Expected MVRV + STH MVRV convergence');
});

test('extreme bottom: convergences include Mayer + Realized Price', () => {
  const hasMayerConvergence = extremeBottom.convergences.some(c => c.includes('Mayer Multiple + Realized Price Ratio'));
  assert.ok(hasMayerConvergence, 'Expected Mayer + Realized Price convergence');
});

// ============================================================
// 3. Bottom Detector - Neutral (all normal)
// ============================================================

console.log('\n--- Bottom Detector (neutral data) ---');

const neutralIndicators = makeIndicators({
  mvrv: 2.0,                // well above 1.0 watch
  sthMvrv: 1.2,             // well above 0.9 watch
  mayerMultiple: 1.2,       // well above 0.8 watch
  realizedPriceRatio: 1.5,  // well above 1.1 watch
  lthSopr: 1.1,             // well above 0.95 watch
  avivRatio: 1.2,           // well above 0.9 watch
  cvddRatio: 2.5,           // well above 1.5 watch
  terminalPriceRatio: 0.5,  // well above 0.3 watch
});

const neutralBottom = detectBottom(neutralIndicators);

test('neutral data: bottom score = 0', () => {
  assert.strictEqual(neutralBottom.score, 0);
});

test('neutral data: all signals are NORMAL', () => {
  for (const signal of neutralBottom.signals) {
    assert.strictEqual(signal.tier, 'NORMAL', `Expected ${signal.name} to be NORMAL, got ${signal.tier}`);
  }
});

test('neutral data: no convergences', () => {
  assert.strictEqual(neutralBottom.convergences.length, 0);
});

// ============================================================
// 4. Top Detector - Real Data
// ============================================================

console.log('\n--- Top Detector (real data) ---');

const realTop = detectTop(realIndicators);

test('real data: top score = 0 (no top signals)', () => {
  assert.strictEqual(realTop.score, 0);
});

test('real data: all top signals are NORMAL', () => {
  for (const signal of realTop.signals) {
    assert.strictEqual(signal.tier, 'NORMAL', `Expected ${signal.name} to be NORMAL, got ${signal.tier}`);
  }
});

test('real data: top maxScore = 6', () => {
  assert.strictEqual(realTop.maxScore, 6);
});

test('real data: top has 6 signals total', () => {
  assert.strictEqual(realTop.signals.length, 6);
});

test('real data: no top convergences', () => {
  assert.strictEqual(realTop.convergences.length, 0);
});

// ============================================================
// 5. Top Detector - Extreme Top (all 6 in EXTREME)
// ============================================================

console.log('\n--- Top Detector (extreme top) ---');

const extremeTopIndicators = makeIndicators({
  mvrv: 4.0,               // >= 3.5 extreme
  sthMvrv: 2.0,            // >= 1.8 extreme
  mayerMultiple: 2.5,      // >= 2.4 extreme
  lthMvrv: 4.5,            // >= 4.0 extreme
  avivRatio: 3.0,          // >= 2.5 extreme
  terminalPriceRatio: 0.95, // >= 0.9 extreme
});

const extremeTop = detectTop(extremeTopIndicators);

test('extreme top: score = 6 (all indicators EXTREME)', () => {
  assert.strictEqual(extremeTop.score, 6);
});

test('extreme top: every signal tier is EXTREME', () => {
  for (const signal of extremeTop.signals) {
    assert.strictEqual(signal.tier, 'EXTREME', `Expected ${signal.name} to be EXTREME, got ${signal.tier}`);
  }
});

test('extreme top: convergences include both MVRV and STH MVRV', () => {
  const hasMvrvConvergence = extremeTop.convergences.some(c => c.includes('Both MVRV and STH MVRV'));
  assert.ok(hasMvrvConvergence, 'Expected MVRV + STH MVRV convergence');
});

test('extreme top: convergences include Terminal Price ceiling', () => {
  const hasTerminal = extremeTop.convergences.some(c => c.includes('Terminal Price ceiling'));
  assert.ok(hasTerminal, 'Expected Terminal Price ceiling convergence');
});

test('extreme top: convergences include Mayer + LTH MVRV euphoria', () => {
  const hasEuphoria = extremeTop.convergences.some(c => c.includes('Mayer Multiple + LTH MVRV'));
  assert.ok(hasEuphoria, 'Expected Mayer + LTH MVRV euphoria convergence');
});

test('extreme top: 6+ indicators convergence message', () => {
  const hasConvergence = extremeTop.convergences.some(c => c.includes('top indicators converging'));
  assert.ok(hasConvergence, 'Expected 3+ top indicators convergence');
});

// ============================================================
// 6. Risk Engine
// ============================================================

console.log('\n--- Risk Engine ---');

const neutralInd = makeIndicators();

// 6a. ACUMULAR: bottom > 0, top = 0
test('risk: ACUMULAR when bottom > 0 and top = 0', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  assert.strictEqual(risk.level, 'ACUMULAR');
});

// 6b. DISTRIBUIR: bottom = 0, top > 0
test('risk: DISTRIBUIR when bottom = 0 and top > 0', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(3));
  assert.strictEqual(risk.level, 'DISTRIBUIR');
});

// 6c. NEUTRO: bottom = 0, top = 0
test('risk: NEUTRO when bottom = 0 and top = 0', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  assert.strictEqual(risk.level, 'NEUTRO');
});

// 6d. INCERTEZA: bottom > 0, top > 0
test('risk: INCERTEZA when bottom > 0 and top > 0', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(2), makeTopScore(2));
  assert.strictEqual(risk.level, 'INCERTEZA');
});

// 6e. Urgency levels
test('risk: urgency = CRITICAL when maxScore >= 5', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(5), makeTopScore(0));
  assert.strictEqual(risk.urgency, 'CRITICAL');
});

test('risk: urgency = HIGH when maxScore >= 3', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  assert.strictEqual(risk.urgency, 'HIGH');
});

test('risk: urgency = MEDIUM when maxScore >= 1', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(1), makeTopScore(0));
  assert.strictEqual(risk.urgency, 'MEDIUM');
});

test('risk: urgency = LOW when both scores = 0', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  assert.strictEqual(risk.urgency, 'LOW');
});

// 6f. Action determination
test('risk: suggestedAction = BUY_SOL when ACUMULAR with score >= 2', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  assert.strictEqual(risk.suggestedAction, 'BUY_SOL');
});

test('risk: suggestedAction = SELL_SOL when DISTRIBUIR with score >= 2', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(3));
  assert.strictEqual(risk.suggestedAction, 'SELL_SOL');
});

test('risk: suggestedAction = HOLD when ACUMULAR with low score (1)', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(1), makeTopScore(0));
  assert.strictEqual(risk.suggestedAction, 'HOLD');
});

// 6g. Exposure calculations
test('risk: ACUMULAR exposure can reach 100% at score=8', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(8), makeTopScore(0));
  assert.strictEqual(risk.exposurePercent, 100);
});

test('risk: ACUMULAR exposure = 40% at score=3', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  assert.strictEqual(risk.exposurePercent, BOTTOM_EXPOSURE_MAP[3]);
  assert.strictEqual(risk.exposurePercent, 40);
});

test('risk: DISTRIBUIR exposure = 90% at top score=1 (100 - 10)', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(1));
  assert.strictEqual(risk.exposurePercent, 100 - TOP_EXPOSURE_MAP[1]);
  assert.strictEqual(risk.exposurePercent, 90);
});

test('risk: DISTRIBUIR exposure never goes below 50% (max sell = 50%)', () => {
  // TOP_EXPOSURE_MAP caps at 50 for score=6, so exposure = 100 - 50 = 50.
  // This enforces the user's rule: never sell more than 50% of SOL.
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(6));
  assert.strictEqual(risk.exposurePercent, 50);
  // Verify across all top scores: exposure always >= 50%
  for (let score = 0; score <= 6; score++) {
    const r = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(score));
    assert.ok(r.exposurePercent >= 50,
      `DISTRIBUIR exposure at score=${score} is ${r.exposurePercent}%, expected >= 50%`);
  }
});

test('risk: NEUTRO exposure = 50%', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  assert.strictEqual(risk.exposurePercent, 50);
});

test('risk: INCERTEZA exposure = 50%', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(3));
  assert.strictEqual(risk.exposurePercent, 50);
});

// 6h. Rationale includes risk level text
test('risk: rationale includes risk level', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  assert.ok(risk.rationale.some(r => r.includes('ACUMULAR')), 'Rationale should mention ACUMULAR');
});

// 6i. Price triggers are generated
test('risk: price triggers are generated with real indicator data', () => {
  const risk = assessRisk(realIndicators, makeBottomScore(3), makeTopScore(0));
  assert.ok(risk.priceTriggers.length > 0, 'Expected at least one price trigger');
});

test('risk: price triggers include Mayer Multiple levels', () => {
  const risk = assessRisk(realIndicators, makeBottomScore(3), makeTopScore(0));
  const hasMayer = risk.priceTriggers.some(t => t.label.includes('Mayer'));
  assert.ok(hasMayer, 'Expected Mayer Multiple price trigger');
});

test('risk: price triggers include MVRV levels', () => {
  const risk = assessRisk(realIndicators, makeBottomScore(3), makeTopScore(0));
  const hasMvrv = risk.priceTriggers.some(t => t.label.includes('MVRV'));
  assert.ok(hasMvrv, 'Expected MVRV price trigger');
});

// ============================================================
// 7. Loan Advisor
// ============================================================

console.log('\n--- Loan Advisor ---');

// 7a. Bottom zone with score >= 5 generates OPPORTUNITY warning
test('loan: bottom >= 5 with no top signals generates OPPORTUNITY warning', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(5), makeTopScore(0));
  const warnings = assessLoanRisk(risk, []);
  const opportunity = warnings.find(w => w.severity === 'OPPORTUNITY');
  assert.ok(opportunity, 'Expected OPPORTUNITY warning');
  assert.ok(opportunity.message.includes('STRONG BOTTOM ZONE'), 'Expected STRONG BOTTOM ZONE message');
});

test('loan: bottom >= 3 (but < 5) with no top signals generates OPPORTUNITY', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(3), makeTopScore(0));
  const warnings = assessLoanRisk(risk, []);
  const opportunity = warnings.find(w => w.severity === 'OPPORTUNITY');
  assert.ok(opportunity, 'Expected OPPORTUNITY warning for score >= 3');
});

test('loan: bottom = 1 with no top signals generates INFO (early signal)', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(1), makeTopScore(0));
  const warnings = assessLoanRisk(risk, []);
  const info = warnings.find(w => w.severity === 'INFO' && w.message.includes('Early bottom signals'));
  assert.ok(info, 'Expected INFO warning for early bottom signals');
});

// 7b. Top zone with score >= 3 generates DANGER warning
test('loan: top >= 3 generates DANGER warning', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(3));
  const warnings = assessLoanRisk(risk, []);
  const danger = warnings.find(w => w.severity === 'DANGER');
  assert.ok(danger, 'Expected DANGER warning');
  assert.ok(danger.message.includes('DELEVERAGE NOW'), 'Expected DELEVERAGE NOW message');
});

test('loan: top >= 5 generates CRITICAL danger warning', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(5));
  const warnings = assessLoanRisk(risk, []);
  const criticalDanger = warnings.filter(w => w.severity === 'DANGER');
  assert.ok(criticalDanger.length >= 2, 'Expected at least 2 DANGER warnings for score >= 5');
  const hasRepayAll = criticalDanger.some(w => w.message.includes('REPAY ALL DEFI LOANS'));
  assert.ok(hasRepayAll, 'Expected REPAY ALL DEFI LOANS message');
});

test('loan: top 1-2 generates WARNING (early deleverage)', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(1));
  const warnings = assessLoanRisk(risk, []);
  const warn = warnings.find(w => w.severity === 'WARNING' && w.message.includes('START PLANNING'));
  assert.ok(warn, 'Expected early warning about deleveraging');
});

// 7c. Neutral zone generates INFO
test('loan: neutral zone (no signals) generates INFO', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  const warnings = assessLoanRisk(risk, []);
  const info = warnings.find(w => w.severity === 'INFO' && w.message.includes('No strong cycle signals'));
  assert.ok(info, 'Expected neutral INFO warning');
});

// 7d. Position-specific: LTV > 80% = DANGER
test('loan: position with LTV > 80% generates DANGER', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  const position = makeLendingPosition({ ltv: 85, liquidationPrice: 45, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  const danger = warnings.find(w => w.severity === 'DANGER' && w.message.includes('DANGEROUSLY HIGH'));
  assert.ok(danger, 'Expected DANGER for LTV > 80%');
  assert.ok(danger.position, 'Expected position in warning');
  assert.strictEqual(danger.position!.ltv, 85);
});

test('loan: position with LTV 65-80% generates WARNING', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  const position = makeLendingPosition({ ltv: 70, liquidationPrice: 45, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  const warn = warnings.find(w => w.severity === 'WARNING' && w.message.includes('Consider adding collateral'));
  assert.ok(warn, 'Expected WARNING for LTV 65-80%');
});

test('loan: position with healthy LTV generates INFO', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  const position = makeLendingPosition({ ltv: 40, liquidationPrice: 30, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  const info = warnings.find(w => w.severity === 'INFO' && w.message.includes('Healthy'));
  assert.ok(info, 'Expected INFO for healthy LTV');
});

// 7e. Combined: top signal + high LTV = DANGER
test('loan: top signals + LTV > 50% generates combined DANGER', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(3));
  const position = makeLendingPosition({ ltv: 60, liquidationPrice: 45, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  const combinedDanger = warnings.find(w =>
    w.severity === 'DANGER' && w.message.includes('Top signals active AND LTV')
  );
  assert.ok(combinedDanger, 'Expected combined DANGER for top signals + high LTV');
});

// 7f. Warnings are sorted by severity (DANGER first)
test('loan: warnings are sorted by severity (DANGER first)', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(4));
  const position = makeLendingPosition({ ltv: 85, liquidationPrice: 45, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  assert.ok(warnings.length > 0, 'Expected warnings');
  assert.strictEqual(warnings[0].severity, 'DANGER', 'First warning should be DANGER');
});

// 7g. Liquidation distance is calculated correctly
test('loan: liquidation distance calculated correctly', () => {
  const risk = assessRisk(neutralInd, makeBottomScore(0), makeTopScore(0));
  const position = makeLendingPosition({ ltv: 50, liquidationPrice: 40, currentPrice: 100 });
  const warnings = assessLoanRisk(risk, [position]);
  const posWarning = warnings.find(w => w.liquidationDistance !== undefined);
  assert.ok(posWarning, 'Expected warning with liquidationDistance');
  // (100 - 40) / 100 * 100 = 60%
  assert.strictEqual(posWarning.liquidationDistance, 60);
});

// ============================================================
// End-to-end: Real data through the full pipeline
// ============================================================

console.log('\n--- End-to-End (real data pipeline) ---');

test('e2e: real data produces ACUMULAR risk level', () => {
  const bottom = detectBottom(realIndicators);
  const top = detectTop(realIndicators);
  const risk = assessRisk(realIndicators, bottom, top);
  assert.strictEqual(risk.level, 'ACUMULAR');
  assert.strictEqual(risk.bottomScore.score, 3);
  assert.strictEqual(risk.topScore.score, 0);
});

test('e2e: real data produces BUY_SOL action', () => {
  const bottom = detectBottom(realIndicators);
  const top = detectTop(realIndicators);
  const risk = assessRisk(realIndicators, bottom, top);
  assert.strictEqual(risk.suggestedAction, 'BUY_SOL');
});

test('e2e: real data produces HIGH urgency', () => {
  const bottom = detectBottom(realIndicators);
  const top = detectTop(realIndicators);
  const risk = assessRisk(realIndicators, bottom, top);
  assert.strictEqual(risk.urgency, 'HIGH');
});

test('e2e: real data produces 40% exposure', () => {
  const bottom = detectBottom(realIndicators);
  const top = detectTop(realIndicators);
  const risk = assessRisk(realIndicators, bottom, top);
  assert.strictEqual(risk.exposurePercent, 40);
});

test('e2e: real data loan advisor generates OPPORTUNITY', () => {
  const bottom = detectBottom(realIndicators);
  const top = detectTop(realIndicators);
  const risk = assessRisk(realIndicators, bottom, top);
  const warnings = assessLoanRisk(risk, []);
  const opportunity = warnings.find(w => w.severity === 'OPPORTUNITY');
  assert.ok(opportunity, 'Expected OPPORTUNITY warning for real bottom data');
});

// ============================================================
// Summary
// ============================================================

const total = passed + failed;
console.log('\n============================================================');
console.log(`${passed}/${total} tests passed`);

if (failures.length > 0) {
  console.log('\nFailed tests:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  console.log('============================================================\n');
  process.exit(1);
} else {
  console.log('All tests passed!');
  console.log('============================================================\n');
}
