import { useWalletUi } from '@wallet-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { createLocalnetConnection, signAndSendTransactionWithLocalKeypair } from './local-transaction-helper';
import { loadOrCreateKeypair } from './keypair-loader';
import { Transaction } from '@solana/web3.js';

/**
 * A hook that returns a function to sign and send transactions
 * If on localnet, it uses the local keypair
 * Otherwise, it uses the connected wallet
 */
export function useLocalWallet() {
  const { cluster, client, account } = useWalletUi();
  const [isLocalnet, setIsLocalnet] = useState<boolean>(false);
  
  useEffect(() => {
    setIsLocalnet(cluster?.id === 'solana:localnet');
  }, [cluster]);
  
  /**
   * Signs and sends a transaction
   * Uses local keypair if on localnet, otherwise uses the connected wallet
   */
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      // If on localnet, use the local keypair
      if (isLocalnet) {
        const connection = createLocalnetConnection();
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        return signAndSendTransactionWithLocalKeypair(transaction, connection);
      }
      
      // Otherwise, use the connected wallet
      if (!client || !account) {
        throw new Error('Wallet not connected');
      }
      
      // Get recent blockhash
      const { value: blockhash } = await client.rpc.getLatestBlockhash().send();
      transaction.recentBlockhash = blockhash;
      
      // Get fee payer (wallet)
      transaction.feePayer = account.address;
      
      // Sign and send transaction
      const signedTx = await account.signTransaction(transaction);
      const signature = await client.rpc.sendTransaction(signedTx.serialize()).send();
      
      return signature.value;
    },
    [isLocalnet, client, account]
  );
  
  /**
   * Get the public key to use for transactions
   * Uses local keypair if on localnet, otherwise uses the connected wallet
   */
  const getPublicKey = useCallback(() => {
    if (isLocalnet) {
      return loadOrCreateKeypair().publicKey;
    }
    
    if (!account) {
      throw new Error('Wallet not connected');
    }
    
    return account.address;
  }, [isLocalnet, account]);
  
  return {
    isLocalnet,
    signAndSendTransaction,
    getPublicKey,
  };
} 