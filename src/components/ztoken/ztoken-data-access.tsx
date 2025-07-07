import {
  ZtokenAccount,
  getCloseInstruction,
  getZtokenProgramAccounts,
  getZtokenProgramId,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '@project/anchor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { generateKeyPairSigner } from 'gill'
import { useWalletUi } from '@wallet-ui/react'
import { useWalletTransactionSignAndSend } from '../solana/use-wallet-transaction-sign-and-send'
import { useClusterVersion } from '@/components/cluster/use-cluster-version'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'

// Import simple token type for now
type TokenMetadataAccount = {
  address: string;
  data: {
    name: string;
    symbol: string;
    decimals: number;
    mint: string;
    authority: string;
  };
}

// We'll use dummy token functions for now
// In a real implementation, these would be properly implemented using the Solana program

export function useZtokenProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getZtokenProgramId(cluster.id), [cluster])
}

export function useZtokenProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useZtokenProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useZtokenInitializeMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => {
      const ztoken = await generateKeyPairSigner()
      return await signAndSend(getInitializeInstruction({ payer: signer, ztoken }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['ztoken', 'accounts', { cluster }] })
    },
    onError: () => toast.error('Failed to run program'),
  })
}

export function useZtokenDecrementMutation({ ztoken }: { ztoken: ZtokenAccount }) {
  const invalidateAccounts = useZtokenAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ ztoken: ztoken.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useZtokenIncrementMutation({ ztoken }: { ztoken: ZtokenAccount }) {
  const invalidateAccounts = useZtokenAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ ztoken: ztoken.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useZtokenSetMutation({ ztoken }: { ztoken: ZtokenAccount }) {
  const invalidateAccounts = useZtokenAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          ztoken: ztoken.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useZtokenCloseMutation({ ztoken }: { ztoken: ZtokenAccount }) {
  const invalidateAccounts = useZtokenAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, ztoken: ztoken.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useZtokenAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useZtokenAccountsQueryKey(),
    queryFn: async () => await getZtokenProgramAccounts(client.rpc),
  })
}

function useZtokenAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useZtokenAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useZtokenAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['ztoken', 'accounts', { cluster }]
}

// New token functions - mock implementations for now

export function useCreateTokenMutation() {
  const { cluster } = useWalletUi()
  
  return useMutation({
    mutationFn: async ({ name, symbol, decimals = 9, initSupply }: { name: string; symbol: string; decimals?: number; initSupply: number }) => {
      console.log(`Creating token: ${name} (${symbol}) with ${decimals} decimals and ${initSupply} initial supply`);
      // In a real implementation, we would call the create_mint instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("Token created successfully")
    },
    onError: (error) => toast.error(`Failed to create token: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useCreateOrGetAtaMutation() {
  return useMutation({
    mutationFn: async ({ mint, user }: { mint: string; user: string }) => {
      console.log(`Creating ATA for mint ${mint} and user ${user}`);
      // In a real implementation, we would call the create_or_get_ata instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("ATA created successfully")
    },
    onError: (error) => toast.error(`Failed to create ATA: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useCloseAtaMutation() {
  return useMutation({
    mutationFn: async ({ ata }: { ata: string }) => {
      console.log(`Closing ATA: ${ata}`);
      // In a real implementation, we would call the close_ata instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("ATA closed successfully")
    },
    onError: (error) => toast.error(`Failed to close ATA: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useTransferMutation() {
  return useMutation({
    mutationFn: async ({ fromAta, toAta, mint, amount }: { fromAta: string; toAta: string; mint: string; amount: number }) => {
      console.log(`Transferring ${amount} tokens from ${fromAta} to ${toAta} for mint ${mint}`);
      // In a real implementation, we would call the transfer instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("Tokens transferred successfully")
    },
    onError: (error) => toast.error(`Failed to transfer tokens: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useMintToMutation() {
  return useMutation({
    mutationFn: async ({ mint, toAta, tokenMetadata, amount }: { mint: string; toAta: string; tokenMetadata: string; amount: number }) => {
      console.log(`Minting ${amount} tokens to ${toAta} for mint ${mint}`);
      // In a real implementation, we would call the mint_to instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("Tokens minted successfully")
    },
    onError: (error) => toast.error(`Failed to mint tokens: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useFreezeAccountMutation() {
  return useMutation({
    mutationFn: async ({ accountToFreeze }: { accountToFreeze: string }) => {
      console.log(`Freezing account: ${accountToFreeze}`);
      // In a real implementation, we would call the freeze_account instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("Account frozen successfully")
    },
    onError: (error) => toast.error(`Failed to freeze account: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useUnfreezeAccountMutation() {
  return useMutation({
    mutationFn: async ({ accountToFreeze }: { accountToFreeze: string }) => {
      console.log(`Unfreezing account: ${accountToFreeze}`);
      // In a real implementation, we would call the unfreeze_account instruction
      return "tx_signature_placeholder";
    },
    onSuccess: () => {
      toast.success("Account unfrozen successfully")
    },
    onError: (error) => toast.error(`Failed to unfreeze account: ${error instanceof Error ? error.message : String(error)}`),
  });
}

export function useTokenMetadataQuery() {
  const { cluster } = useWalletUi()
  
  return useQuery({
    queryKey: ['token-metadata', { cluster }],
    queryFn: async () => {
      // Mock token metadata for demo purposes
      return [
        {
          address: "token1address",
          data: {
            name: "Demo Token",
            symbol: "DEMO",
            decimals: 9,
            mint: "mintAddress1",
            authority: "authorityAddress1",
          }
        },
        {
          address: "token2address",
          data: {
            name: "Test Token",
            symbol: "TEST",
            decimals: 6,
            mint: "mintAddress2",
            authority: "authorityAddress2",
          }
        }
      ] as TokenMetadataAccount[];
    },
  });
}
