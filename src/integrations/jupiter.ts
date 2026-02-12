import fetch from 'node-fetch';
import { JupiterQuoteResponse, JupiterSwapResponse } from '../types';
import { logger } from '../utils/logger';

const DEFAULT_API_URL = 'https://quote-api.jup.ag/v6';

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number, // in smallest unit (lamports for SOL, 10^6 for USDC)
  slippageBps: number = 100,
  apiUrl: string = DEFAULT_API_URL
): Promise<JupiterQuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  });

  const url = `${apiUrl}/quote?${params}`;
  logger.info(`Jupiter quote: ${inputMint.slice(0, 8)}... -> ${outputMint.slice(0, 8)}... amount=${amount}`);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as JupiterQuoteResponse;
  logger.success(`Jupiter quote: in=${data.inAmount} out=${data.outAmount} impact=${data.priceImpactPct}%`);
  return data;
}

export async function getSwapTransaction(
  quoteResponse: JupiterQuoteResponse,
  userPublicKey: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<JupiterSwapResponse> {
  const url = `${apiUrl}/swap`;
  logger.info(`Jupiter swap: building transaction for ${userPublicKey.slice(0, 8)}...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as JupiterSwapResponse;
  logger.success('Jupiter swap transaction built successfully');
  return data;
}

export async function getPrice(tokenMint: string): Promise<number> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${tokenMint}`);
    const data = (await res.json()) as any;
    const price = parseFloat(data?.data?.[tokenMint]?.price);
    return price || 0;
  } catch {
    return 0;
  }
}
