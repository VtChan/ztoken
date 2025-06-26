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
