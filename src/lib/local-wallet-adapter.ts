import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { UiWalletAdapter } from '@wallet-ui/react';

/**
 * Local wallet adapter that uses a keypair loaded from local storage or environment
 * This is used only for development with localnet
 */
export class LocalWalletAdapter implements UiWalletAdapter {
  private _keypair: Keypair | null = null;
  private _ready = false;
  
  readonly name = 'Local Keypair';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDEuNjY2NjdDNS40MDAwMSAxLjY2NjY3IDEuNjY2NjcgNS40MDAwMSAxLjY2NjY3IDEwQzEuNjY2NjcgMTQuNiA1LjQwMDAxIDE4LjMzMzMgMTAgMTguMzMzM0MxNC42IDE4LjMzMzMgMTguMzMzMyAxNC42IDE4LjMzMzMgMTBDMTguMzMzMyA1LjQwMDAxIDE0LjYgMS42NjY2NyAxMCAxLjY2NjY3Wk0xMCAxNi42NjY3QzYuMzI1MDEgMTYuNjY2NyAzLjMzMzM0IDEzLjY3NSAzLjMzMzM0IDEwQzMuMzMzMzQgNi4zMjUwMSA2LjMyNTAxIDMuMzMzMzQgMTAgMy4zMzMzNEMxMy42NzUgMy4zMzMzNCAxNi42NjY3IDYuMzI1MDEgMTYuNjY2NyAxMEMxNi42NjY3IDEzLjY3NSAxMy42NzUgMTYuNjY2NyAxMCAxNi42NjY3WiIgZmlsbD0iIzREQjVGRiIvPgo8cGF0aCBkPSJNMTAgNS44MzMzNEM5LjA4MzM0IDUuODMzMzQgOC4zMzMzNCA2LjU4MzM0IDguMzMzMzQgNy41QzguMzMzMzQgOC40MTY2NyA5LjA4MzM0IDkuMTY2NjcgMTAgOS4xNjY2N0MxMC45MTY3IDkuMTY2NjcgMTEuNjY2NyA4LjQxNjY3IDExLjY2NjcgNy41QzExLjY2NjcgNi41ODMzNCAxMC45MTY3IDUuODMzMzQgMTAgNS44MzMzNFoiIGZpbGw9IiM0REI1RkYiLz4KPHBhdGggZD0iTTEwIDExLjY2NjdDOC4xNSAxMS42NjY3IDYuNjY2NjcgMTMuMTUgNi42NjY2NyAxNVYxNS44MzMzSDEzLjMzMzNWMTVDMTMuMzMzMyAxMy4xNSAxMS44NSAxMS42NjY3IDEwIDExLjY2NjdaIiBmaWxsPSIjNERCNUZGIi8+Cjwvc3ZnPgo=';
  readonly supportedTransactionVersions = new Set(['legacy', 0]);
  
  // Store key in localstorage with this key
  private readonly LOCAL_STORAGE_KEY = 'local_wallet_keypair';

  constructor(privateKeyBase58?: string) {
    if (privateKeyBase58) {
      this.loadKeypairFromBase58(privateKeyBase58);
    } else {
      this.loadFromLocalStorage();
    }
    this._ready = true;
  }

  get publicKey(): PublicKey | null {
    return this._keypair?.publicKey || null;
  }

  get readyState() {
    return {
      isReady: this._ready,
      isUnsupported: false,
      isInstalled: true,
    };
  }

  /**
   * Load a keypair from a base58 encoded private key string
   */
  loadKeypairFromBase58(privateKeyBase58: string): void {
    try {
      const decodedKey = bs58.decode(privateKeyBase58);
      this._keypair = Keypair.fromSecretKey(decodedKey);
      this.saveToLocalStorage(privateKeyBase58);
    } catch (error) {
      console.error('Failed to load keypair from base58 string:', error);
      throw error;
    }
  }

  /**
   * Generate a new random keypair
   */
  generateKeypair(): string {
    this._keypair = Keypair.generate();
    const privateKeyBase58 = bs58.encode(this._keypair.secretKey);
    this.saveToLocalStorage(privateKeyBase58);
    return privateKeyBase58;
  }

  /**
   * Save the keypair to local storage
   */
  private saveToLocalStorage(privateKeyBase58: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, privateKeyBase58);
    }
  }

  /**
   * Load the keypair from local storage
   */
  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const privateKeyBase58 = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (privateKeyBase58) {
        this.loadKeypairFromBase58(privateKeyBase58);
      } else {
        // Generate a new keypair if none exists
        this.generateKeypair();
      }
    }
  }

  /**
   * Returns the current keypair
   */
  get keypair(): Keypair | null {
    return this._keypair;
  }

  /**
   * Connect to the wallet
   */
  async connect(): Promise<void> {
    if (!this._keypair) {
      this.generateKeypair();
    }
    return Promise.resolve();
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._keypair) {
      throw new Error('Keypair not loaded');
    }
    
    // Add signer to transaction
    transaction.partialSign(this._keypair);
    return transaction;
  }

  /**
   * Sign multiple transactions
   */
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this._keypair) {
      throw new Error('Keypair not loaded');
    }
    
    return transactions.map(tx => {
      tx.partialSign(this._keypair!);
      return tx;
    });
  }

  /**
   * Sign a message
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._keypair) {
      throw new Error('Keypair not loaded');
    }
    
    // Use nacl for signing
    return nacl.sign.detached(message, this._keypair.secretKey);
  }
} 