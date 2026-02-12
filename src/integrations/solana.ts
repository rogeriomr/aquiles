import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from '../utils/logger';

let _connection: Connection | null = null;
let _keypair: Keypair | null = null;

export function getConnection(rpcUrl: string): Connection {
  if (!_connection) {
    _connection = new Connection(rpcUrl, 'confirmed');
    logger.info(`Solana RPC connected: ${rpcUrl.substring(0, 40)}...`);
  }
  return _connection;
}

export function loadKeypair(privateKey: string): Keypair {
  if (!_keypair) {
    try {
      // Try base58 decode first
      const decoded = bs58.decode(privateKey);
      _keypair = Keypair.fromSecretKey(decoded);
    } catch {
      // Try JSON array format
      try {
        const arr = JSON.parse(privateKey);
        _keypair = Keypair.fromSecretKey(Uint8Array.from(arr));
      } catch {
        throw new Error('Invalid private key format. Use base58 or JSON array.');
      }
    }
    logger.info(`Wallet loaded: ${_keypair.publicKey.toBase58().slice(0, 8)}...`);
  }
  return _keypair;
}

export function getPublicKey(privateKey: string): string {
  const kp = loadKeypair(privateKey);
  return kp.publicKey.toBase58();
}

export async function getBalance(rpcUrl: string, address: string): Promise<number> {
  const connection = getConnection(rpcUrl);
  const balance = await connection.getBalance(new PublicKey(address));
  return balance;
}

export async function sendVersionedTransaction(
  rpcUrl: string,
  privateKey: string,
  swapTransactionBase64: string
): Promise<string> {
  const connection = getConnection(rpcUrl);
  const keypair = loadKeypair(privateKey);

  // Deserialize the versioned transaction
  const swapTransactionBuf = Buffer.from(swapTransactionBase64, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign the transaction
  transaction.sign([keypair]);

  // Send and confirm
  logger.info('Sending transaction to Solana network...');
  const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  logger.info(`Transaction sent: ${txSignature}`);

  // Wait for confirmation
  const latestBlockhash = await connection.getLatestBlockhash();
  const confirmation = await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }, 'confirmed');

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  logger.success(`Transaction confirmed: ${txSignature}`);
  return txSignature;
}
