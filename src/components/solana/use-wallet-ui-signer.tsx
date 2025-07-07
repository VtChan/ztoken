import { UiWalletAccount, useWalletAccountTransactionSendingSigner, useWalletUi } from '@wallet-ui/react'
import { useMemo } from 'react'
import { loadOrCreateKeypair } from '@/lib/keypair-loader'
import { address, TransactionSendingSigner } from 'gill'
import nacl from 'tweetnacl'

export function useWalletUiSigner(): TransactionSendingSigner | undefined {
  const { account, cluster } = useWalletUi()

  return useMemo(() => {
    if (!account || !cluster) {
      return undefined;
    }

    // Check if we're on localnet
    if (cluster.id === 'solana:localnet') {
      // Get the local keypair for localnet operations
      const keypair = loadOrCreateKeypair()
      
      // Return a transaction signer based on the local keypair
      const signer = {
        address: address(keypair.publicKey.toBase58()),
        sign: async (message: Uint8Array) => {
          // Use nacl to sign with the keypair's secretKey
          return nacl.sign.detached(message, keypair.secretKey)
        },
        // Mock implementations for transaction signing functions
        signAndSendTransactions: async () => {
          console.log("Using mock signAndSendTransactions for localnet");
          // Return a simple Uint8Array as mock signature
          return new Uint8Array(64).fill(1);
        },
        modifyAndSignTransactions: async (transactions: unknown[]) => {
          console.log("Using mock modifyAndSignTransactions for localnet");
          // Return the transactions as-is
          return transactions;
        }
      };
      
      // Type assertion to make TypeScript happy
      return signer as unknown as TransactionSendingSigner;
    }

    // For other clusters, use the standard wallet signer
    return useWalletAccountTransactionSendingSigner(account as UiWalletAccount, cluster.id)
  }, [account, cluster])
}
