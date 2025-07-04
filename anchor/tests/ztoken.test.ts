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

  // recipient
  const recipient = Keypair.generate();

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
    const ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      payer.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );

    // make sure the ata exist
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
    
    // close ata
    await program.methods
      .closeAta()
      .accounts({
        user: payer.publicKey,
        userAta: ata,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .rpc();
    
    // make sure the ata is closed
    let closed = false;

    try {
      await getAccount(connection, ata)
    } catch (e) {
      closed = true;
    }
    expect(closed).toBeTruthy();
  });

  it("should tranfer successful", async() => {
    

    const recipient_ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipient.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );

    // create ATA for recipient pay by payer
    await program.methods
      .createOrGetAta()
      .accounts({
        payer: payer.publicKey,
        user: recipient.publicKey,
        mint: mintAccount.publicKey,
        userAta: recipient_ata,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // payer tranfer to recipient
    const transferAmount = new BN(100);
    await program.methods
      .transfer(transferAmount)
      .accounts({
        fromAuthority: payer.publicKey,
        fromAta: tokenAccount.publicKey,
        toAta: recipient_ata,
        mint: mintAccount.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        frozenAccount: null,
      })
      .signers([])
      .rpc();
    
    // check balance 
    const payerAtaInfo = await getAccount(connection, tokenAccount.publicKey);
    const recipientAtaInfo = await getAccount(connection, recipient_ata);
    expect(payerAtaInfo.amount.toString()).toEqual(amount.sub(transferAmount).toString());
    expect(recipientAtaInfo.amount.toString()).toEqual(transferAmount.toString());
  });

  it("should can not transfer if insufficient funds", async() => {
    const recipient_ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipient.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );
    let failed = false;
    let transferAmount = new BN(1_000_000)
    try {
      await program.methods
        .transfer(transferAmount) // over balance
        .accounts({
          fromAuthority: payer.publicKey,
          fromAta: tokenAccount.publicKey,
          toAta: recipient_ata,
          mint: mintAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([])
        .rpc();
    } catch (e) {
      failed = true;
      // e.message should include:Insufficient funds for transfer
      console.log("transfer fail:\n", e.message);
    }
    expect(failed).toBeTruthy();
  });

  it("should not allow unauthorized mint", async() => {
    let failed = true;
    const extraAmount = new BN(100);
    const unauthorized = Keypair.generate();
    const recipient_ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipient.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );
    try {
      await program.methods
        .mintTo(extraAmount)
        .accounts({
          authority: unauthorized.publicKey,
          mint: mintAccount.publicKey,
          toAta: recipient_ata,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadata: tokenMetadata.publicKey,
        })
        .signers([unauthorized])
        .rpc();
    } catch (e) {
      failed = true;
      expect(e.message).toContain("Unauthorized");
    }
    expect(failed).toBeTruthy();
  });

  it("should now allow transfer from frozen account", async() => {
    const recipient_ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipient.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );
    // a recipient
    const recipient2 = Keypair.generate();
    const recipient2_ata = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipient2.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );

    await program.methods
      .createOrGetAta()
      .accounts({
        payer: payer.publicKey,
        user: recipient2.publicKey,
        mint: mintAccount.publicKey,
        userAta: recipient2_ata,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // freeze account
    const [frozenAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("frozen"), recipient.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .freezeAccount()
      .accounts({
        authority: payer.publicKey,
        frozenAccount: frozenAccountPda,
        accountToFreeze: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    
    // try to transfer, it should fail
    let failed = false;
    const transferAmount = new BN(10);
    try {
      await program.methods
        .transfer(transferAmount)
        .accounts({
          fromAuthority: recipient.publicKey,
          fromAta: recipient_ata,
          toAta: recipient2_ata,
          mint: mintAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          frozenAccount: frozenAccountPda,
        })
        .signers([recipient])
        .rpc();
    } catch (e) {
      failed = true;
      expect(e.message).toContain("Account is frozen");
    }

    expect(failed).toBeTruthy();

    // unfreeze 
    await program.methods
      .unfreezeAccount()
      .accounts({
        authority: payer.publicKey,
        frozenAccount: frozenAccountPda,
        accountToFreeze: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    
    // try transfer again
    await program.methods
      .transfer(transferAmount)
      .accounts({
        fromAuthority: recipient.publicKey,
        fromAta: recipient_ata,
        toAta: recipient2_ata,
        mint: mintAccount.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        frozenAccount: frozenAccountPda,
      })
      .signers([recipient])
      .rpc();
    // check recipient2_ata's balance
    const recipient2AtaInfo = await getAccount(connection, recipient2_ata);
    expect(recipient2AtaInfo.amount.toString()).toEqual(transferAmount.toString());
  });
})
