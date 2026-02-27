# Aquiles

## Description
Cross-chain intelligence agent that uses Bitcoin on-chain indicators to manage Solana exposure with auto-trading and smart alerts. Removes emotion from trading by reading blockchain data.

## When to Use
- Managing SOL exposure based on BTC cycle indicators
- Avoiding buying tops and selling bottoms
- Auto-trading on Jupiter DEX based on risk scores
- Getting DeFi lending guidance (when to leverage/deleverage)
- Receiving alerts with on-chain rationale

## How It Works

Aquiles uses 8 bottom indicators + 6 top indicators from BTC on-chain data:
- **Bottom signals**: MVRV, NUPL, Puell Multiple, Reserve Risk, etc.
- **Top signals**: Pi Cycle, RHODL Ratio, Terminal Price, etc.

Based on aggregate risk score, it can:
1. **Auto Mode**: Buy/sell SOL via Jupiter swaps
2. **Alert Mode**: Send notifications with full indicator breakdown
3. **Lending Advisor**: Guide Kamino/Jupiter loan management

## Setup

```bash
git clone https://github.com/rogeriomr/aquiles
cd aquiles
cp .env.example .env
# Configure: SOLANA_RPC, WALLET_PRIVATE_KEY, GLASSNODE_API_KEY
npm install && npm run start
```

## API Example

```bash
# Get current risk assessment
GET /api/risk-score

# Response:
{
  "risk_score": 72,
  "signal": "elevated_risk",
  "active_top_indicators": ["pi_cycle", "rhodl"],
  "recommendation": "reduce_exposure",
  "confidence": 0.85
}
```

## Requirements
- Glassnode API (for BTC on-chain data)
- Solana RPC
- Wallet with SOL for trading

## Links
- Repository: https://github.com/rogeriomr/aquiles
- Glassnode: https://glassnode.com
