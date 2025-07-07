import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Local storage key for persisting the keypair
const LOCAL_STORAGE_KEY = 'solana_local_keypair';

/**
 * Loads a keypair from local storage or generates a new one
 * This is used only for development with localnet
 */
export function loadOrCreateKeypair(): Keypair {
  // Only run in browser
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return Keypair.generate();
  }

  // Try to load from localStorage
  const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  if (storedKey) {
    try {
      const secretKey = bs58.decode(storedKey);
      return Keypair.fromSecretKey(secretKey);
    } catch (e) {
      console.error('Failed to load keypair from localStorage:', e);
      // Fall through to generate a new one
    }
  }

  // Generate a new keypair
  const keypair = Keypair.generate();
  // Save to localStorage
  localStorage.setItem(LOCAL_STORAGE_KEY, bs58.encode(keypair.secretKey));
  
  return keypair;
}

/**
 * Gets the keypair from local storage without creating a new one if it doesn't exist
 */
export function getStoredKeypair(): Keypair | null {
  // Only run in browser
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  // Try to load from localStorage
  const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  if (storedKey) {
    try {
      const secretKey = bs58.decode(storedKey);
      return Keypair.fromSecretKey(secretKey);
    } catch (e) {
      console.error('Failed to load keypair from localStorage:', e);
    }
  }

  return null;
}

/**
 * Deletes the stored keypair
 */
export function clearStoredKeypair(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
} 