import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isLocalnetRunning } from '@/lib/local-transaction-helper';
import { LocalKeypairDisplay } from './LocalKeypairDisplay';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useWalletUi } from '@wallet-ui/react';

export function LocalnetWarning() {
  const [isLocalnet, setIsLocalnet] = useState(false);
  const { cluster } = useWalletUi();
  
  useEffect(() => {
    // Check if we're connected to localnet
    const checkLocalnet = async () => {
      try {
        if (cluster?.id === 'solana:localnet') {
          const running = await isLocalnetRunning();
          setIsLocalnet(running);
        } else {
          setIsLocalnet(false);
        }
      } catch (error) {
        console.error('Error checking localnet:', error);
        setIsLocalnet(false);
      }
    };
    
    checkLocalnet();
  }, [cluster]);
  
  if (!isLocalnet) return null;
  
  return (
    <div className="mb-6 space-y-4">
      <Alert variant="warning">
        <AlertTitle className="flex items-center">
          Localnet Connection
        </AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            You are connected to Solana localnet. Most browser wallets don't support localnet by default.
            For local development, use the auto-generated keypair below.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://docs.solana.com/cli/install-solana-cli-tools" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <span>Solana CLI Tools</span>
                <ExternalLink size={14} />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://docs.solana.com/cli/developlocally" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <span>Local Development</span>
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
      <LocalKeypairDisplay />
    </div>
  );
} 