import { WalletButton } from '../solana/solana-provider'
import { ZtokenButtonInitialize, ZtokenList, ZtokenProgramExplorerLink, ZtokenProgramGuard } from './ztoken-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function ZtokenFeature() {
  const { account } = useWalletUi()

  return (
    <ZtokenProgramGuard>
      <AppHero
        title="Ztoken"
        subtitle={
          account
            ? "Initialize a new ztoken onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <ZtokenProgramExplorerLink />
        </p>
        {account ? (
          <ZtokenButtonInitialize />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <ZtokenList /> : null}
    </ZtokenProgramGuard>
  )
}
