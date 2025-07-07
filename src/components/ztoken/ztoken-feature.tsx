import { ZtokenButtonInitialize, ZtokenList, ZtokenProgramExplorerLink, ZtokenProgramGuard, TokenFeature } from './ztoken-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { useWalletUi } from '@wallet-ui/react'
import { WalletButton } from '@/components/solana/solana-provider'
import { LocalnetWarning } from '@/components/dev/LocalnetWarning'

export function ZtokenFeature() {
  const { account, cluster } = useWalletUi()
  const isLocalnet = cluster?.id === 'solana:localnet';

  // Display connect wallet button if wallet is not connected
  if (!account || !cluster) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect your wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to use the ZToken Program
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <WalletButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Show LocalnetWarning when using localnet */}
      {isLocalnet && <LocalnetWarning />}
      
      <ZtokenProgramGuard>
        <ZtokenProgramExplorerLink />
        <Tabs defaultValue="token">
          <TabsList className="mb-2">
            <TabsTrigger value="token">Token</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="initialize">Initialize</TabsTrigger>
          </TabsList>
          <TabsContent value="token">
            <TokenFeature />
          </TabsContent>
          <TabsContent value="list">
            <ZtokenList />
          </TabsContent>
          <TabsContent value="initialize">
            <ZtokenButtonInitialize />
          </TabsContent>
        </Tabs>
      </ZtokenProgramGuard>
    </div>
  )
}
