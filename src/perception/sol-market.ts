import fetch from 'node-fetch';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logger } from '../utils/logger';

function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 15000): Promise<any> {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)),
  ]) as Promise<any>;
}

export async function getSolPrice(): Promise<number> {
  try {
    // Try Jupiter price API first
    const res = await fetchWithTimeout('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
    const data = await res.json() as any;
    const price = parseFloat(data?.data?.['So11111111111111111111111111111111111111112']?.price);
    if (price && price > 0) {
      logger.success(`SOL price from Jupiter: $${price.toFixed(2)}`);
      return price;
    }
  } catch (e) {
    logger.warn('Jupiter price API failed, trying CoinGecko...');
  }

  try {
    // Fallback to CoinGecko
    const res = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json() as any;
    const price = data?.solana?.usd;
    if (price && price > 0) {
      logger.success(`SOL price from CoinGecko: $${price.toFixed(2)}`);
      return price;
    }
  } catch (e) {
    logger.warn('CoinGecko price API failed');
  }

  throw new Error('Could not fetch SOL price from any source');
}

export async function getSolBalance(rpcUrl: string, walletAddress: string): Promise<number> {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    logger.info(`Wallet balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    return balance;
  } catch (e) {
    logger.error(`Failed to get SOL balance: ${e}`);
    return 0;
  }
}

export async function getUsdcBalance(rpcUrl: string, walletAddress: string): Promise<number> {
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const pubkey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      mint: new PublicKey(USDC_MINT),
    });
    if (tokenAccounts.value.length > 0) {
      const amount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
      return parseInt(amount);
    }
    return 0;
  } catch (e) {
    logger.error(`Failed to get USDC balance: ${e}`);
    return 0;
  }
}
