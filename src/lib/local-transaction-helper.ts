import { Transaction, SendOptions, Connection } from '@solana/web3.js';
import { getStoredKeypair, loadOrCreateKeypair } from './keypair-loader';

/**
 * Signs and sends a transaction using the local keypair
 * @param transaction The transaction to send
 * @param connection The Solana connection
 * @param options Send options
 * @returns Transaction signature
 */
export async function signAndSendTransactionWithLocalKeypair(
  transaction: Transaction,
  connection: Connection,
  options?: SendOptions
): Promise<string> {
  // Get or create keypair
  const keypair = getStoredKeypair() || loadOrCreateKeypair();
  
  // Set recent blockhash if not already set
  if (!transaction.recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
  }
  
  // Sign the transaction
  transaction.sign(keypair);
  
  // Send the transaction
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    options
  );
  
  return signature;
}

/**
 * Creates a new Connection to the local Solana cluster
 * @returns A Connection object for the local cluster
 */
export function createLocalnetConnection(): Connection {
  return new Connection('http://127.0.0.1:8899', 'confirmed');
}

/**
 * A utility to check if the localnet is running
 * @returns True if the localnet is accessible
 */
export async function isLocalnetRunning(): Promise<boolean> {
  try {
    const connection = createLocalnetConnection();
    await connection.getVersion();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Requests an airdrop to the local keypair
 * @param amount Amount in SOL (not lamports)
 * @returns Signature of the airdrop transaction
 */
export async function requestAirdropToLocalKeypair(amount: number = 2): Promise<string> {
  const keypair = getStoredKeypair() || loadOrCreateKeypair();
  const connection = createLocalnetConnection();
  
  // Convert SOL to lamports (1 SOL = 10^9 lamports)
  const lamports = amount * 1_000_000_000;
  
  const signature = await connection.requestAirdrop(
    keypair.publicKey,
    lamports
  );
  
  // Wait for confirmation
  await connection.confirmTransaction(signature);
  
  return signature;
} 