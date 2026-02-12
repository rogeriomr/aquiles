# Aquiles

**Cross-chain intelligence agent that uses Bitcoin on-chain indicators to manage Solana exposure with auto-trading and smart alerts.**

Built for the [Colosseum Agent Hackathon](https://www.colosseum.org) (February 2026).

---

## The Problem

Crypto investors lack tools that leverage Bitcoin's superior on-chain data to manage altcoin exposure. BTC leads market cycles with the most reliable on-chain indicators for detecting cycle tops and bottoms, yet Solana traders make decisions without this cross-chain intelligence -- leading to poor timing on entries/exits and unnecessary liquidations on lending protocols.

## The Solution

Aquiles uses **8 bottom indicators + 6 top indicators** from BTC on-chain data to calculate a risk score and, based on that score:

- **Auto Mode**: Automatically buys/sells SOL via Jupiter DEX swaps on Solana mainnet
- **Alert Mode**: Sends detailed alerts with rationale, indicator breakdown, and price triggers

## What Makes This Unique

Out of 683+ projects in the Colosseum hackathon, **none** combine Bitcoin on-chain analysis with Solana execution. Aquiles fills this gap with a unique cross-chain intelligence approach.

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
- **ACUMULAR**: Bottom signals active, no top signals -> Increase SOL exposure
- **DISTRIBUIR**: Top signals active, no bottom signals -> Reduce SOL exposure
- **NEUTRO**: No strong signals -> Hold positions
- **INCERTEZA**: Mixed signals -> Hedge with balanced allocation

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

## How It Works

### 1. Perception Layer
- Loads BTC on-chain indicators from `data/indicators.json`
- Fetches SOL price via Jupiter/CoinGecko
- Checks wallet balances and lending positions

### 2. Analysis Engine
- **Bottom Detector**: Scores each of 8 indicators as NORMAL/WATCH/STRONG/EXTREME
- **Top Detector**: Scores each of 6 indicators with same tier system
- **Risk Engine**: Combines scores into risk level, urgency, suggested action, and exposure %
- **Loan Advisor**: Warns about lending risks based on cycle position

### 3. Action Layer
- **Alert Mode**: Generates formatted report with all indicators, convergences, price triggers, and recommendations
- **Auto Mode**: Calculates trade size, gets Jupiter quote, executes SOL/USDC swap on Solana mainnet
- **Reporter**: Produces comprehensive markdown report

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

- Real-time Glassnode/CryptoQuant API integration
- Multi-chain execution (ETH, ARB)
- Telegram/Discord bot interface
- Backtesting engine for historical cycle validation
- Integration with Drift, Marinade, and more Solana protocols
- Web dashboard with historical charts

---

## License

MIT
