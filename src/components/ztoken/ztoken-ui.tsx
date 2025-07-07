import { ellipsify } from '@wallet-ui/react'
import {
  useZtokenAccountsQuery,
  useZtokenCloseMutation,
  useZtokenDecrementMutation,
  useZtokenIncrementMutation,
  useZtokenInitializeMutation,
  useZtokenProgram,
  useZtokenProgramId,
  useZtokenSetMutation,
  useCreateTokenMutation,
  useCreateOrGetAtaMutation,
  useCloseAtaMutation,
  useTransferMutation,
  useMintToMutation,
  useFreezeAccountMutation,
  useUnfreezeAccountMutation,
  useTokenMetadataQuery,
} from './ztoken-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ZtokenAccount } from '@project/anchor'
import { ReactNode, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWalletUi } from '@wallet-ui/react'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'

// Import the TokenMetadataAccount type
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

export function ZtokenProgramExplorerLink() {
  const programId = useZtokenProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function ZtokenList() {
  const ztokenAccountsQuery = useZtokenAccountsQuery()

  if (ztokenAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!ztokenAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {ztokenAccountsQuery.data?.map((ztoken) => <ZtokenCard key={ztoken.address} ztoken={ztoken} />)}
    </div>
  )
}

export function ZtokenProgramGuard({ children }: { children: ReactNode }) {
  const programAccountQuery = useZtokenProgram()

  if (programAccountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!programAccountQuery.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return children
}

function ZtokenCard({ ztoken }: { ztoken: ZtokenAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ztoken: {ztoken.data.count}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink address={ztoken.address} label={ellipsify(ztoken.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <ZtokenButtonIncrement ztoken={ztoken} />
          <ZtokenButtonSet ztoken={ztoken} />
          <ZtokenButtonDecrement ztoken={ztoken} />
          <ZtokenButtonClose ztoken={ztoken} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ZtokenButtonInitialize() {
  const mutationInitialize = useZtokenInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Ztoken {mutationInitialize.isPending && '...'}
    </Button>
  )
}

export function ZtokenButtonIncrement({ ztoken }: { ztoken: ZtokenAccount }) {
  const incrementMutation = useZtokenIncrementMutation({ ztoken })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}

export function ZtokenButtonSet({ ztoken }: { ztoken: ZtokenAccount }) {
  const setMutation = useZtokenSetMutation({ ztoken })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', ztoken.data.count.toString() ?? '0')
        if (!value || parseInt(value) === ztoken.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}

export function ZtokenButtonDecrement({ ztoken }: { ztoken: ZtokenAccount }) {
  const decrementMutation = useZtokenDecrementMutation({ ztoken })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}

export function ZtokenButtonClose({ ztoken }: { ztoken: ZtokenAccount }) {
  const closeMutation = useZtokenCloseMutation({ ztoken })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}

export function TokenFeature() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list')
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Token Manager</h1>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'list' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('list')}
          >
            Token List
          </Button>
          <Button 
            variant={activeTab === 'create' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('create')}
          >
            Create Token
          </Button>
        </div>
      </div>

      {activeTab === 'create' ? <CreateTokenForm /> : <TokenList />}
    </div>
  )
}

function CreateTokenForm() {
  const createTokenMutation = useCreateTokenMutation()
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    initSupply: 1000000000,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'decimals' || name === 'initSupply' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTokenMutation.mutateAsync(formData)
      setFormData({
        name: '',
        symbol: '',
        decimals: 9,
        initSupply: 1000000000,
      })
    } catch (error) {
      console.error('Error creating token:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Token</CardTitle>
        <CardDescription>Fill the form to create a new token</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Token Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Token"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="symbol">Token Symbol</Label>
            <Input
              id="symbol"
              name="symbol"
              placeholder="MTK"
              value={formData.symbol}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="decimals">Decimals</Label>
            <Input
              id="decimals"
              name="decimals"
              type="number"
              min="0"
              max="9"
              value={formData.decimals}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initSupply">Initial Supply</Label>
            <Input
              id="initSupply"
              name="initSupply"
              type="number"
              min="1"
              value={formData.initSupply}
              onChange={handleChange}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={createTokenMutation.isPending}
          >
            {createTokenMutation.isPending ? 'Creating...' : 'Create Token'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function TokenList() {
  const tokenMetadataQuery = useTokenMetadataQuery()

  if (tokenMetadataQuery.isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!tokenMetadataQuery.data?.length) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-xl mb-4">No tokens found</p>
          <p>Create your first token to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tokenMetadataQuery.data.map((token) => (
        <TokenCard key={token.address} token={token} />
      ))}
    </div>
  )
}

function TokenCard({ token }: { token: TokenMetadataAccount }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{token.data.name} ({token.data.symbol})</CardTitle>
            <CardDescription>
              Mint: <ExplorerLink address={token.data.mint} label={ellipsify(token.data.mint)} />
            </CardDescription>
          </div>
          <TokenActions token={token} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Decimals</p>
            <p>{token.data.decimals}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Authority</p>
            <ExplorerLink address={token.data.authority} label={ellipsify(token.data.authority)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TokenActions({ token }: { token: TokenMetadataAccount }) {
  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Transfer</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer {token.data.name}</DialogTitle>
            <DialogDescription>Send tokens to another wallet</DialogDescription>
          </DialogHeader>
          <TransferForm token={token} />
        </DialogContent>
      </Dialog>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Mint</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mint {token.data.name}</DialogTitle>
            <DialogDescription>Create additional tokens</DialogDescription>
          </DialogHeader>
          <MintForm token={token} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Manage</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {token.data.name}</DialogTitle>
            <DialogDescription>Create accounts and manage permissions</DialogDescription>
          </DialogHeader>
          <ManageForm token={token} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TransferForm({ token }: { token: TokenMetadataAccount }) {
  const transferMutation = useTransferMutation()
  const createAtaMutation = useCreateOrGetAtaMutation()
  const { account } = useWalletUi()
  const [formData, setFormData] = useState({
    recipient: '',
    amount: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // First ensure recipient has an ATA
      if (formData.recipient) {
        await createAtaMutation.mutateAsync({
          mint: token.data.mint,
          user: formData.recipient
        })
        
        // Calculate ATAs
        const fromAta = getAssociatedTokenAddressSync(
          new PublicKey(token.data.mint),
          new PublicKey(account?.address || '')
        )
        
        const toAta = getAssociatedTokenAddressSync(
          new PublicKey(token.data.mint),
          new PublicKey(formData.recipient)
        )
        
        // Transfer tokens
        await transferMutation.mutateAsync({
          fromAta: fromAta.toString(),
          toAta: toAta.toString(),
          mint: token.data.mint,
          amount: formData.amount * Math.pow(10, token.data.decimals),
        })
      }
    } catch (error) {
      console.error('Error transferring tokens:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input
          id="recipient"
          name="recipient"
          placeholder="Solana address"
          value={formData.recipient}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.000000001"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={transferMutation.isPending || createAtaMutation.isPending}
      >
        {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
      </Button>
    </form>
  )
}

function MintForm({ token }: { token: TokenMetadataAccount }) {
  const mintToMutation = useMintToMutation()
  const createAtaMutation = useCreateOrGetAtaMutation()
  const { account } = useWalletUi()
  const [formData, setFormData] = useState({
    recipient: '',
    amount: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const recipient = formData.recipient || account?.address || ''
      
      // Ensure recipient has an ATA
      await createAtaMutation.mutateAsync({
        mint: token.data.mint,
        user: recipient
      })
      
      const toAta = getAssociatedTokenAddressSync(
        new PublicKey(token.data.mint),
        new PublicKey(recipient)
      )
      
      // Mint tokens
      await mintToMutation.mutateAsync({
        mint: token.data.mint,
        toAta: toAta.toString(),
        tokenMetadata: token.address,
        amount: formData.amount * Math.pow(10, token.data.decimals),
      })
    } catch (error) {
      console.error('Error minting tokens:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="recipient">Recipient Address (leave blank for your wallet)</Label>
        <Input
          id="recipient"
          name="recipient"
          placeholder="Solana address (optional)"
          value={formData.recipient}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount to Mint</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={mintToMutation.isPending || createAtaMutation.isPending}
      >
        {mintToMutation.isPending ? 'Minting...' : 'Mint Tokens'}
      </Button>
    </form>
  )
}

function ManageForm({ token }: { token: TokenMetadataAccount }) {
  const createAtaMutation = useCreateOrGetAtaMutation()
  const closeAtaMutation = useCloseAtaMutation()
  const freezeMutation = useFreezeAccountMutation()
  const unfreezeMutation = useUnfreezeAccountMutation()
  const [formData, setFormData] = useState({
    accountAddress: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateAta = async () => {
    try {
      if (!formData.accountAddress) return
      await createAtaMutation.mutateAsync({
        mint: token.data.mint,
        user: formData.accountAddress
      })
    } catch (error) {
      console.error('Error creating ATA:', error)
    }
  }

  const handleFreezeAccount = async () => {
    try {
      if (!formData.accountAddress) return
      await freezeMutation.mutateAsync({
        accountToFreeze: formData.accountAddress
      })
    } catch (error) {
      console.error('Error freezing account:', error)
    }
  }

  const handleUnfreezeAccount = async () => {
    try {
      if (!formData.accountAddress) return
      await unfreezeMutation.mutateAsync({
        accountToFreeze: formData.accountAddress
      })
    } catch (error) {
      console.error('Error unfreezing account:', error)
    }
  }

  const handleCloseAta = async () => {
    try {
      if (!formData.accountAddress) return
      
      const ata = getAssociatedTokenAddressSync(
        new PublicKey(token.data.mint),
        new PublicKey(formData.accountAddress)
      )
      
      await closeAtaMutation.mutateAsync({
        ata: ata.toString()
      })
    } catch (error) {
      console.error('Error closing ATA:', error)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="accountAddress">Account Address</Label>
        <Input
          id="accountAddress"
          name="accountAddress"
          placeholder="Solana address"
          value={formData.accountAddress}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleCreateAta}
          disabled={createAtaMutation.isPending}
        >
          {createAtaMutation.isPending ? 'Creating...' : 'Create ATA'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleCloseAta}
          disabled={closeAtaMutation.isPending}
        >
          {closeAtaMutation.isPending ? 'Closing...' : 'Close ATA'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleFreezeAccount}
          disabled={freezeMutation.isPending}
        >
          {freezeMutation.isPending ? 'Freezing...' : 'Freeze Account'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={handleUnfreezeAccount}
          disabled={unfreezeMutation.isPending}
        >
          {unfreezeMutation.isPending ? 'Unfreezing...' : 'Unfreeze Account'}
        </Button>
      </div>
    </div>
  )
}
