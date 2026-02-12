// ============================================================
// Aquiles Agent - Type Definitions
// ============================================================

// --- On-Chain Indicator Data ---

export interface OnChainIndicators {
  timestamp: string;
  btcPrice: number;
  realizedPrice: number;
  sthCostBasis: number;
  sma200: number;
  trueMarketMean: number;
  cvddFloor: number;
  terminalPrice: number;
  mvrv: number;
  sthMvrv: number;
  lthMvrv: number;
  mayerMultiple: number;
  realizedPriceRatio: number;
  lthSopr: number;
  avivRatio: number;
  cvddRatio: number;
  terminalPriceRatio: number;
}

// --- Signal Classification ---

export type SignalTier = 'NORMAL' | 'WATCH' | 'STRONG' | 'EXTREME';

export interface Signal {
  name: string;
  value: number;
  tier: SignalTier;
  threshold: string;
  description: string;
}

// --- Bottom Detection ---

export interface BottomScore {
  score: number;        // 0-8: count of STRONG or EXTREME signals
  maxScore: number;     // always 8
  signals: Signal[];
  convergences: string[];
}

// --- Top Detection ---

export interface TopScore {
  score: number;        // 0-6: count of STRONG or EXTREME signals
  maxScore: number;     // always 6
  signals: Signal[];
  convergences: string[];
}

// --- Risk Assessment ---

export type RiskLevel = 'ACUMULAR' | 'DISTRIBUIR' | 'NEUTRO' | 'INCERTEZA';
export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriceTrigger {
  price: number;
  label: string;
  direction: 'above' | 'below';
}

export interface RiskAssessment {
  level: RiskLevel;
  urgency: Urgency;
  suggestedAction: TradeDirection;
  exposurePercent: number;     // 0-100: recommended SOL exposure
  bottomScore: BottomScore;
  topScore: TopScore;
  priceTriggers: PriceTrigger[];
  rationale: string[];
}

// --- Trade Actions ---

export type TradeDirection = 'BUY_SOL' | 'SELL_SOL' | 'HOLD';

export interface TradeAction {
  direction: TradeDirection;
  percent: number;             // % of portfolio to trade
  inputMint: string;
  outputMint: string;
  amount: number;              // in lamports or smallest unit
  slippageBps: number;
}

export interface TradeResult {
  success: boolean;
  txSignature?: string;
  inputAmount: number;
  outputAmount: number;
  price: number;
  error?: string;
}

// --- Alerts ---

export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'OPPORTUNITY';
export type AlertSignal =
  | 'COMPRA FORTE'
  | 'ACUMULACAO'
  | 'ATENCAO'
  | 'DISTRIBUICAO'
  | 'VENDA FORTE'
  | 'NEUTRO';

export interface Alert {
  signal: AlertSignal;
  severity: AlertSeverity;
  riskAssessment: RiskAssessment;
  loanWarnings: LoanWarning[];
  report: string;
  timestamp: string;
}

// --- Lending / Loan ---

export interface LendingPosition {
  protocol: string;            // "kamino" | "marginfi"
  collateralMint: string;
  collateralAmount: number;
  debtMint: string;
  debtAmount: number;
  ltv: number;                 // loan-to-value ratio
  liquidationPrice: number;
  currentPrice: number;
}

export interface LoanWarning {
  severity: AlertSeverity;
  message: string;
  position?: LendingPosition;
  liquidationDistance?: number; // % away from liquidation
}

// --- Agent Config ---

export type AgentMode = 'auto' | 'alert';

export interface AgentConfig {
  mode: AgentMode;
  rpcUrl: string;
  jupiterApiUrl: string;
  walletPrivateKey?: string;
  colosseumApiKey?: string;
  colosseumAgentId?: number;
  maxSlippageBps: number;
  maxTradePercent: number;
  loopIntervalMinutes: number;
}

// --- Jupiter API Types ---

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

// --- Colosseum API Types ---

export interface ColosseumProject {
  name: string;
  description: string;
  repoLink: string;
  solanaIntegration: string;
  problemStatement: string;
  technicalApproach: string;
  targetAudience: string;
  businessModel: string;
  competitiveLandscape: string;
  futureVision: string;
  tags: string[];
}
