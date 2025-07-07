import { ZtokenButtonInitialize, ZtokenList, ZtokenProgramExplorerLink, ZtokenProgramGuard, TokenFeature } from './ztoken-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export function ZtokenFeature() {
  return (
    <div className="container mx-auto py-6">
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>ZToken Program</CardTitle>
            <CardDescription>
              Program ID: <ZtokenProgramExplorerLink />
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="counter" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="counter">Counter Demo</TabsTrigger>
          <TabsTrigger value="token">Token Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="counter" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Counter Demo</CardTitle>
              <CardDescription>Initialize and interact with counter accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex justify-center">
                <ZtokenButtonInitialize />
              </div>
              <ZtokenProgramGuard>
                <ZtokenList />
              </ZtokenProgramGuard>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="token" className="pt-4">
          <ZtokenProgramGuard>
            <TokenFeature />
          </ZtokenProgramGuard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
