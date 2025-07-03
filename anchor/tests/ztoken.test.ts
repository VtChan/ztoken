import { Ztoken } from './../target/types/ztoken'
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

import {  BN, Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { getAccount, getMint, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

const IDL = require("../target/idl/ztoken.json")
const programId = new PublicKey("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H")


describe('ztoken', () => {
  // TODO: Implement tests for the ztoken program based on the Codama generated client.
  // Use tests in `legacy/legacy-next-tailwind-ztoken/anchor/tests/ztoken.test.ts` as a reference.
  // init program
  let context;
  let provider;
  let program;
  let payer;
  let connection;


  beforeAll(async () => {
    context = await startAnchor("", [{name : "ztoken", programId}], []);
	  provider = new BankrunProvider(context);
    connection = provider.connection;

    program = new Program<Ztoken>(
      IDL,
      provider,
    );
    payer = provider.wallet.payer;
  });
  // Create accounts needed for the test
  const mintAccount = Keypair.generate();
  const tokenAccount = Keypair.generate();
  const tokenMetadata = Keypair.generate();
  const amount = new BN(1000);

  async function createMintFixture() {
    
    // Create instruction data with valid parameters
    const name = "Test Mint";
    const symbol = "TST";
    const decimals = 6;

    // Create and send transaction
    await program.methods
    .createMint(
      name,
      symbol,
      decimals,
      amount
    )
    .accounts({
      payer: payer.publicKey,
      mint: mintAccount.publicKey,
      tokenAccount: tokenAccount.publicKey,
      tokenMetadata: tokenMetadata.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([mintAccount, tokenAccount, tokenMetadata])
    .rpc();

    return { mintAccount, tokenAccount, tokenMetadata };
  }


  

  it("can create a token mint", async() => {
    const { mintAccount, tokenAccount, tokenMetadata } = await createMintFixture();
    const { name, symbol, decimals } = await program.account.tokenMetadata.fetch(tokenMetadata.publicKey);

    // Verify mint was created
    const mintInfo = await getMint(connection, mintAccount.publicKey);
    console.log("mintInfo:\n", mintInfo);
    expect(mintInfo.decimals.toString).toEqual(decimals.toString);
    expect(mintInfo.freezeAuthority).toBeNull();
  
    // Verify token account was created
    const tokenAccountInfo = await getAccount(connection, tokenAccount.publicKey);
    expect(tokenAccountInfo.amount.toString()).toEqual(amount.toString());

    // Verify token metadata
    const metadata = await program.account.tokenMetadata.fetch(tokenMetadata.publicKey);
    expect(metadata.name).toEqual(name);
    expect(metadata.symbol).toEqual(symbol);
    expect(metadata.decimals).toEqual(decimals);
    expect(metadata.mint.toBase58()).toEqual(mintAccount.publicKey.toBase58());
    expect(metadata.authority.toBase58()).toEqual(payer.publicKey.toBase58());
  });

  it("can create or get an ata", async() => {
    const ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      payer.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    )

    await program.methods
    .createOrGetAta()
    .accounts({
      payer: payer.publicKey,
      user: payer.publicKey,
      mint: mintAccount.publicKey,
      userAta: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

    // verify the ataInfo
    const ataInfo = await getAccount(connection, ata);
    console.log("ataInfo:\n",ataInfo);
    expect(ataInfo.owner.toBase58()).toEqual(payer.publicKey.toBase58());
    expect(ataInfo.mint.toBase58()).toEqual(mintAccount.publicKey.toBase58());

    // call again
    await program.methods
    .createOrGetAta()
    .accounts({
      payer: payer.publicKey,
      user: payer.publicKey,
      mint: mintAccount.publicKey,
      userAta: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
  });

  it("should close the ata", async() => {
    
  });
})
