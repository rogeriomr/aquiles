# Aquiles

**Cross-chain intelligence agent that uses Bitcoin on-chain indicators to manage Solana exposure with auto-trading and smart alerts.**

Built for the [Colosseum Agent Hackathon](https://www.colosseum.org) (February 2026).

---

## Why "Aquiles"?

Every investor has an **Achilles' heel**: buying more during euphoria and greed, and turning bearish at the very bottom. This emotional cycle repeats every time -- people FOMO in at the top when everyone is celebrating, and panic sell at the bottom when fear dominates. This is the single biggest destroyer of portfolio value in crypto.

**Aquiles exists to fix this.** Bitcoin on-chain indicators have been remarkably accurate at identifying cycle tops and bottoms throughout Bitcoin's entire history. By reading what the blockchain itself is telling us -- not headlines, not Twitter sentiment, not gut feeling -- Aquiles removes emotion from the equation and replaces it with data-driven conviction.

## The Problem

Crypto investors lack tools that leverage Bitcoin's superior on-chain data to manage altcoin exposure. BTC leads market cycles, yet Solana traders make decisions based on emotion and price action alone -- leading to:

- **Buying at the top**: Greed and FOMO drive investors to increase exposure at the worst possible moment
- **Selling at the bottom**: Fear and panic cause capitulation right before recoveries
- **Unnecessary liquidations**: Maintaining leveraged positions on Kamino/Jupiter during high-risk periods without cycle awareness
- **Missed opportunities**: Failing to take DeFi loans at cycle bottoms when leverage is safest and upside is highest

## The Solution

Aquiles uses **8 bottom indicators + 6 top indicators** from BTC on-chain data to calculate a risk score and, based on that score:

- **Auto Mode**: Automatically buys/sells SOL via Jupiter DEX swaps on Solana mainnet
- **Alert Mode**: Sends detailed alerts with rationale, indicator breakdown, and price triggers
- **Lending Advisor**: Guides when to deleverage and repay DeFi loans (high risk) vs. when it makes sense to take new positions (low risk)

### DeFi Lending Management

Aquiles doesn't just trade -- it protects your leveraged positions:

- **High risk (top signals active)**: Alerts you to deleverage, repay loans on Kamino and Jupiter, and avoid new borrowing. History shows 50-80% drawdowns from cycle tops -- being leveraged at these levels is the fastest path to liquidation.
- **Low risk (bottom signals active)**: After the market reaches historically low levels confirmed by on-chain data, Aquiles signals that it makes sense to start taking DeFi loans again -- leverage is safest when the downside is limited and the upside is highest.

## What Makes This Unique

Out of 683+ projects in the Colosseum hackathon, **none** combine Bitcoin on-chain analysis with Solana execution. Aquiles fills this gap with a unique cross-chain intelligence approach. On-chain data has been the most reliable tool for navigating Bitcoin's cycles since its inception -- Aquiles brings that intelligence to Solana DeFi users for the first time.

---

## Architecture

```
[BTC On-Chain Data] --> [Perception Layer] --> [Analysis Engine] --> [Decision Engine] --> [Action Layer]
   (JSON/API input)     (fetch & normalize)   (score bottom/top)   (auto vs alert)    (Jupiter swap / Alert)
                                                                         |
                                                                    [Lending Monitor]
                                                                   (liquidation levels)
```

### Bottom Detection (8 Indicators)
| Indicator | What It Measures | Bottom Signal |
|-----------|-----------------|---------------|
| MVRV | Market vs Realized Value | < 1.0 |
| STH MVRV | Short-term holder profit/loss | < 1.0 |
| Mayer Multiple | Price vs 200d MA | < 0.8 |
| Realized Price Ratio | Price vs aggregate cost basis | < 1.05 |
| LTH SOPR | Long-term holder selling behavior | < 1.0 |
| AVIV Ratio | Active value vs investor value | < 0.9 |
| CVDD Ratio | Price vs CVDD floor | < 1.5 |
| Terminal Price Ratio | Price vs terminal ceiling | < 0.3 |

### Top Detection (6 Indicators)
| Indicator | What It Measures | Top Signal |
|-----------|-----------------|------------|
| MVRV | Market vs Realized Value | > 3.0 |
| STH MVRV | Short-term holder euphoria | > 1.5 |
| Mayer Multiple | Price extension above 200d MA | > 2.0 |
| LTH MVRV | Long-term holder extreme profit | > 3.5 |
| AVIV Ratio | Market premium to cost basis | > 2.0 |
| Terminal Price Ratio | Price approaching terminal | > 0.8 |

### Risk Levels
| Level | Condition | Action | Lending Guidance |
|-------|-----------|--------|-----------------|
| **ACCUMULATE** | Bottom signals active, no top signals | Increase SOL exposure | Safe to take DeFi loans -- downside is limited |
| **DISTRIBUTE** | Top signals active, no bottom signals | Reduce SOL exposure | Deleverage and repay loans on Kamino/Jupiter |
| **NEUTRAL** | No strong signals | Hold current positions | Maintain existing positions, avoid new leverage |
| **UNCERTAINTY** | Mixed signals from both sides | Hedge with balanced allocation | Reduce leverage as precaution |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/rogeriomr/aquiles.git
cd aquiles
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

Key environment variables:
- `AGENT_MODE`: `alert` (default) or `auto`
- `SOL_RPC_URL`: Solana RPC endpoint
- `WALLET_PRIVATE_KEY`: Required for auto mode (base58 encoded)
- `COLOSSEUM_API_KEY`: For hackathon submission

### Update Indicators

Edit `data/indicators.json` with current BTC on-chain data from [Yield Lab](https://checkonchain.com/) or similar sources:

```json
{
  "timestamp": "2026-02-12T14:00:00Z",
  "btcPrice": 68040,
  "realizedPrice": 55548,
  "sthCostBasis": 92000,
  "sma200": 101702,
  "trueMarketMean": 79124,
  "cvddFloor": 46133,
  "terminalPrice": 290819,
  "mvrv": 1.22,
  "sthMvrv": 0.74,
  "lthMvrv": 1.67,
  "mayerMultiple": 0.67,
  "realizedPriceRatio": 1.24,
  "lthSopr": 0.78,
  "avivRatio": 0.852,
  "cvddRatio": 1.47,
  "terminalPriceRatio": 0.23
}
```

### Run

```bash
# Single analysis (alert mode)
npx ts-node scripts/run.ts

# Single analysis (auto mode - executes real trades!)
npx ts-node scripts/run.ts --mode=auto

# Continuous monitoring
npx ts-node scripts/run-loop.ts

# Submit to Colosseum
npx ts-node scripts/submit-project.ts
```

---

## Sample Output

```
======================================================================
  AQUILES - BTC ON-CHAIN INTELLIGENCE REPORT
  2026-02-12 14:54:24 UTC
======================================================================

  SIGNAL: >>> ACCUMULATION <<<
  Risk Level: ACCUMULATE | Urgency: HIGH
  BTC Price: $68,040

----------------------------------------------------------------------
  BOTTOM SIGNALS: 3/8
----------------------------------------------------------------------
  [ ] MVRV                      1.220  NORMAL   Market above realized value
  [X] STH MVRV                  0.740  STRONG   Short-term holders at loss, capitulation signal
  [X] Mayer Multiple            0.670  STRONG   Price far below 200d MA, deep discount zone
  [ ] Realized Price Ratio      1.240  NORMAL   Price well above realized price
  [X] LTH SOPR                  0.780  STRONG   Long-term holders selling at loss, deep capitulation
  [ ] AVIV Ratio                0.852  WATCH    Market undervalued vs active investors
  [ ] CVDD Ratio                1.470  WATCH    Price near CVDD floor, strong support zone
  [ ] Terminal Price Ratio      0.230  WATCH    Price far below terminal, deep value zone

  Convergences:
    * 3 indicators converging in bottom zone: STH MVRV, Mayer Multiple, LTH SOPR
    * LTH SOPR below 1.0 - long-term holders capitulating (rare and significant)

----------------------------------------------------------------------
  TOP SIGNALS: 0/6
----------------------------------------------------------------------
  [ ] MVRV                      1.220  NORMAL   Market not yet overvalued
  [ ] STH MVRV                  0.740  NORMAL   Short-term holders not yet euphoric
  [ ] Mayer Multiple            0.670  NORMAL   Price not overextended vs 200d MA
  [ ] LTH MVRV                  1.670  NORMAL   Long-term holders not yet at extreme profit
  [ ] AVIV Ratio                0.852  NORMAL   Market not yet at premium levels
  [ ] Terminal Price Ratio      0.230  NORMAL   Price well below terminal ceiling

----------------------------------------------------------------------
  RECOMMENDATION
----------------------------------------------------------------------
  Action: BUY_SOL
  Recommended SOL Exposure: 40%

----------------------------------------------------------------------
  DEFI LENDING MANAGEMENT (Kamino / Jupiter)
----------------------------------------------------------------------

  The Achilles' heel of investors: leveraging in euphoria, deleveraging at the bottom.
  On-chain data helps break this cycle with objective, historically-proven signals.

  [ $ ] Bottom signals active. On-chain data suggests favorable conditions
        for SOL-collateral loans on Kamino/Jupiter.

======================================================================
  Powered by Aquiles - BTC On-Chain Intelligence for Solana
======================================================================
```

---

## How It Works

### 1. Perception Layer
- Loads BTC on-chain indicators from `data/indicators.json`
- Fetches SOL price via Jupiter/CoinGecko
- Checks wallet balances and lending positions

### 2. Analysis Engine
- **Bottom Detector**: Scores each of 8 indicators as NORMAL/WATCH/STRONG/EXTREME
- **Top Detector**: Scores each of 6 indicators with same tier system
- **Risk Engine**: Combines scores into risk level, urgency, suggested action, and exposure %
- **Loan Advisor**: Guides DeFi lending decisions -- when to deleverage (top) vs. when to borrow (bottom)

### 3. Action Layer
- **Alert Mode**: Generates formatted report with all indicators, convergences, price triggers, and recommendations
- **Auto Mode**: Calculates trade size, gets Jupiter quote, executes SOL/USDC swap on Solana mainnet
- **Reporter**: Produces comprehensive analysis report

---

## Tech Stack

- **TypeScript** + Node.js
- **@solana/web3.js** for Solana blockchain interaction
- **Jupiter V6 API** for DEX aggregation and swap execution
- **dotenv** for configuration

---

## Project Structure

```
aquiles/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   ├── types.ts              # TypeScript interfaces
│   ├── perception/           # Data collection
│   │   ├── btc-onchain.ts    # BTC indicator loading
│   │   ├── sol-market.ts     # SOL price & balance
│   │   └── lending.ts        # Lending positions
│   ├── analysis/             # Scoring engine
│   │   ├── bottom-detector.ts
│   │   ├── top-detector.ts
│   │   ├── risk-engine.ts
│   │   └── loan-advisor.ts
│   ├── actions/              # Execution
│   │   ├── trader.ts         # Jupiter swaps
│   │   ├── alerter.ts        # Alert generation
│   │   └── reporter.ts       # Report generation
│   ├── integrations/         # External APIs
│   │   ├── jupiter.ts        # Jupiter DEX
│   │   ├── solana.ts         # Solana RPC
│   │   └── colosseum.ts      # Hackathon API
│   └── utils/
│       ├── logger.ts
│       └── format.ts
├── scripts/
│   ├── run.ts                # Single run
│   ├── run-loop.ts           # Continuous monitoring
│   └── submit-project.ts     # Hackathon submission
└── data/
    └── indicators.json       # BTC on-chain data
```

---

## Hackathon Submission

- **Name**: Aquiles
- **Repo**: https://github.com/rogeriomr/aquiles
- **Agent ID**: 3860
- **Track**: DeFi / Trading / AI Agent
- **Tags**: ai, defi, trading

---

## Future Vision

- Real-time Glassnode/CryptoQuant API integration for live on-chain data
- Multi-chain execution (ETH, ARB)
- Telegram/Discord bot interface for instant alerts
- Backtesting engine to validate signals against all historical BTC cycles
- Direct integration with Kamino and Jupiter lending for automated deleveraging
- Integration with Drift, Marinade, and more Solana protocols
- Web dashboard with historical charts and cycle visualization

---

## License

MIT
