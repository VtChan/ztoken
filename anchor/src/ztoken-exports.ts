// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, address, getBase58Decoder, SolanaClient } from 'gill'
import { SolanaClusterId } from '@wallet-ui/react'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Ztoken, ZTOKEN_DISCRIMINATOR, ZTOKEN_PROGRAM_ADDRESS, getZtokenDecoder } from './client/js'
import ZtokenIDL from '../target/idl/ztoken.json'

export type ZtokenAccount = Account<Ztoken, string>

// Re-export the generated IDL and type
export { ZtokenIDL }

// This is a helper function to get the program ID for the Ztoken program depending on the cluster.
export function getZtokenProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
    case 'solana:devnet':
    case 'solana:testnet':
      // This is the program ID for the Ztoken program on devnet and testnet.
      return address('6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF')
    case 'solana:mainnet':
    default:
      return ZTOKEN_PROGRAM_ADDRESS
  }
}

export * from './client/js'

export function getZtokenProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getZtokenDecoder(),
    filter: getBase58Decoder().decode(ZTOKEN_DISCRIMINATOR),
    programAddress: ZTOKEN_PROGRAM_ADDRESS,
  })
}
