import { LendingPosition } from '../types';
import { logger } from '../utils/logger';

/**
 * Query lending positions from Kamino/Marginfi.
 * For the hackathon MVP, returns demo positions to showcase the lending advisor.
 * In production, this would query on-chain program accounts.
 */
export async function getLendingPositions(
  _rpcUrl: string,
  _walletAddress: string
): Promise<LendingPosition[]> {
  logger.info('Checking lending positions (Kamino/Marginfi)...');

  // In production, query on-chain:
  // - Kamino: getProgramAccounts with KmarEQhvC87f7w17ZcjamTpvGWR8SVz8G9RTfSVZUGj
  // - Marginfi: getProgramAccounts with MFv2hWf31Z9kbCa4DSi1G6prize8NqATNQvDmwauEZU

  // Demo positions to showcase lending advisor feature
  const demoPositions: LendingPosition[] = [
    {
      protocol: 'Kamino',
      collateralMint: 'So11111111111111111111111111111111111111112',
      collateralAmount: 50,
      debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      debtAmount: 3500,
      ltv: 45.5,
      liquidationPrice: 82.35,
      currentPrice: 153.50,
    },
  ];

  logger.info(`Found ${demoPositions.length} lending position(s) (demo mode)`);
  return demoPositions;
}

export function calculateLiquidationPrice(position: LendingPosition): number {
  // Liquidation happens when collateral value * LTV threshold <= debt value
  // liquidation_price = debt_amount / (collateral_amount * max_ltv)
  const maxLtv = 0.85; // Typical max LTV before liquidation
  if (position.collateralAmount <= 0) return 0;
  return position.debtAmount / (position.collateralAmount * maxLtv);
}

export function calculateLtvAtPrice(position: LendingPosition, price: number): number {
  if (position.collateralAmount <= 0 || price <= 0) return 0;
  const collateralValue = position.collateralAmount * price;
  return (position.debtAmount / collateralValue) * 100;
}
