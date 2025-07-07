import { SolanaClient } from 'gill';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddressSync 
} from '@solana/spl-token';
import { getZtokenProgramId } from '@project/anchor';
import { SolanaClusterId } from '@wallet-ui/react';

// Define our own Signer interface that matches what we need
interface Signer {
  address: string;
  // Add other properties as needed
}

// Create a mint with initial supply
export async function createMintInstruction({
  payer,
  mint,
  name,
  symbol,
  decimals,
  initSupply,
  cluster,
}: {
  payer: Signer;
  mint: anchor.web3.Keypair;
  name: string;
  symbol: string;
  decimals: number;
  initSupply: number;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  // Create token metadata account
  const tokenMetadata = anchor.web3.Keypair.generate();
  
  // Get the associated token account
  const tokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    new PublicKey(payer.address)
  );

  const ix = await createMintIx({
    payer: new PublicKey(payer.address),
    mint: mint.publicKey,
    tokenAccount,
    tokenMetadata: tokenMetadata.publicKey,
    name,
    symbol,
    decimals,
    initSupply,
    programId: new PublicKey(programId)
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [payer, { publicKey: mint.publicKey.toString(), secretKey: mint.secretKey }, { publicKey: tokenMetadata.publicKey.toString(), secretKey: tokenMetadata.secretKey }],
  };
}

async function createMintIx({
  payer,
  mint,
  tokenAccount,
  tokenMetadata,
  name,
  symbol,
  decimals,
  initSupply,
  programId
}: {
  payer: PublicKey;
  mint: PublicKey;
  tokenAccount: PublicKey;
  tokenMetadata: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  initSupply: number;
  programId: PublicKey;
}) {
  return new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: true, isWritable: true },
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenMetadata, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: Buffer.from([
      0, // Instruction index for create_mint
      ...Buffer.from(name),
      ...Buffer.from(symbol),
      decimals,
      ...new anchor.BN(initSupply).toArray("le", 8),
    ]),
  });
}

// Create or get ATA
export async function createOrGetAtaInstruction({
  payer,
  user,
  mint,
  cluster,
}: {
  payer: Signer;
  user: PublicKey;
  mint: PublicKey;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  // Get the associated token account
  const userAta = getAssociatedTokenAddressSync(
    mint,
    user
  );

  const ix = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(payer.address), isSigner: true, isWritable: true },
      { pubkey: user, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([1]), // Instruction index for create_or_get_ata
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [payer],
  };
}

// Close ATA
export async function closeAtaInstruction({
  user,
  userAta,
  cluster,
}: {
  user: Signer;
  userAta: PublicKey;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  const ix = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(user.address), isSigner: true, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([2]), // Instruction index for close_ata
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [user],
  };
}

// Transfer tokens
export async function transferInstruction({
  fromAuthority,
  fromAta,
  toAta,
  mint,
  amount,
  cluster,
  frozenAccount = null,
}: {
  fromAuthority: Signer;
  fromAta: PublicKey;
  toAta: PublicKey;
  mint: PublicKey;
  amount: number;
  cluster: SolanaClusterId;
  frozenAccount?: PublicKey | null;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  const keys = [
    { pubkey: new PublicKey(fromAuthority.address), isSigner: true, isWritable: true },
    { pubkey: fromAta, isSigner: false, isWritable: true },
    { pubkey: toAta, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  if (frozenAccount) {
    keys.push({ pubkey: frozenAccount, isSigner: false, isWritable: false });
  }

  const ix = new anchor.web3.TransactionInstruction({
    keys,
    programId: new PublicKey(programId),
    data: Buffer.from([
      3, // Instruction index for transfer
      ...new anchor.BN(amount).toArray("le", 8),
    ]),
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [fromAuthority],
  };
}

// Mint tokens
export async function mintToInstruction({
  authority,
  mint,
  toAta,
  tokenMetadata,
  amount,
  cluster,
}: {
  authority: Signer;
  mint: PublicKey;
  toAta: PublicKey;
  tokenMetadata: PublicKey;
  amount: number;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  const ix = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(authority.address), isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: toAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: tokenMetadata, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([
      4, // Instruction index for mint_to
      ...new anchor.BN(amount).toArray("le", 8),
    ]),
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [authority],
  };
}

// Freeze account
export async function freezeAccountInstruction({
  authority,
  accountToFreeze,
  cluster,
}: {
  authority: Signer;
  accountToFreeze: PublicKey;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  // Generate the frozen account address using PDA
  const [frozenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("frozen"), accountToFreeze.toBuffer()],
    new PublicKey(programId)
  );

  const ix = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(authority.address), isSigner: true, isWritable: true },
      { pubkey: frozenAccount, isSigner: false, isWritable: true },
      { pubkey: accountToFreeze, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([5]), // Instruction index for freeze_account
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [authority],
  };
}

// Unfreeze account
export async function unfreezeAccountInstruction({
  authority,
  accountToFreeze,
  cluster,
}: {
  authority: Signer;
  accountToFreeze: PublicKey;
  cluster: SolanaClusterId;
}) {
  const transaction = new Transaction();
  const programId = getZtokenProgramId(cluster);
  
  // Generate the frozen account address using PDA
  const [frozenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("frozen"), accountToFreeze.toBuffer()],
    new PublicKey(programId)
  );

  const ix = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: new PublicKey(authority.address), isSigner: true, isWritable: true },
      { pubkey: frozenAccount, isSigner: false, isWritable: true },
      { pubkey: accountToFreeze, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([6]), // Instruction index for unfreeze_account
  });

  transaction.add(ix);
  
  return {
    transaction,
    signers: [authority],
  };
}

export type TokenMetadataAccount = {
  address: string;
  data: {
    name: string;
    symbol: string;
    decimals: number;
    mint: string;
    authority: string;
  };
}

// Function to get token metadata accounts
export async function getTokenMetadataAccounts(client: SolanaClient, cluster: SolanaClusterId) {
  // Mock implementation that doesn't rely on actual RPC calls
  // In a real implementation, we'd query for TokenMetadata accounts
  
  console.log(`Would query for TokenMetadata accounts on ${cluster}`);
  
  // Return mock data for UI demonstration
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
  ];
} 