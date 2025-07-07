import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClipboard } from '@/lib/use-clipboard';
import { getStoredKeypair, loadOrCreateKeypair, clearStoredKeypair } from '@/lib/keypair-loader';
import { createLocalnetConnection, requestAirdropToLocalKeypair, isLocalnetRunning } from '@/lib/local-transaction-helper';
import { PublicKey } from '@solana/web3.js';

export function LocalKeypairDisplay() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const { copy, copied } = useClipboard();
  
  // Check if localnet is running and fetch the current balance
  const fetchData = async () => {
    try {
      const running = await isLocalnetRunning();
      setIsAvailable(running);
      
      if (running) {
        const keypair = getStoredKeypair() || loadOrCreateKeypair();
        setPublicKey(keypair.publicKey);
        
        const connection = createLocalnetConnection();
        const balanceResult = await connection.getBalance(keypair.publicKey);
        setBalance(balanceResult / 1_000_000_000); // Convert lamports to SOL
      }
    } catch (error) {
      console.error('Error checking localnet status:', error);
      setIsAvailable(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchData, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Only show this component if localnet is available
  if (!isAvailable || !publicKey) {
    return null;
  }
  
  const handleAirdrop = async () => {
    try {
      await requestAirdropToLocalKeypair(2);
      
      // Update balance after airdrop
      const connection = createLocalnetConnection();
      const keypair = getStoredKeypair();
      if (keypair) {
        const balanceResult = await connection.getBalance(keypair.publicKey);
        setBalance(balanceResult / 1_000_000_000);
      }
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      alert('Failed to request airdrop. Check console for details.');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local Development Keypair</CardTitle>
        <CardDescription>
          This keypair is stored in your browser for local development with Solana localnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium">Public Key:</span>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                {publicKey.toString()}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copy(publicKey.toString())}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium">Balance:</span>
            <div className="bg-muted p-2 rounded">
              {balance !== null ? `${balance.toFixed(6)} SOL` : 'Loading...'}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleAirdrop}
            >
              Request Airdrop (2 SOL)
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset your local keypair? This will create a new keypair and you will lose access to this one.')) {
                  clearStoredKeypair();
                  const keypair = loadOrCreateKeypair();
                  setPublicKey(keypair.publicKey);
                  setBalance(0);
                }
              }}
            >
              Reset Keypair
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 