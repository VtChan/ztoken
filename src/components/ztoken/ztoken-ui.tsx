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
} from './ztoken-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ZtokenAccount } from '@project/anchor'
import { ReactNode } from 'react'

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
