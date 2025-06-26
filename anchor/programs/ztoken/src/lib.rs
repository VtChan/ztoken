#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod ztoken {
    use super::*;

    pub fn close(_ctx: Context<CloseZtoken>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.ztoken.count = ctx.accounts.ztoken.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.ztoken.count = ctx.accounts.ztoken.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeZtoken>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.ztoken.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeZtoken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Ztoken::INIT_SPACE,
  payer = payer
    )]
    pub ztoken: Account<'info, Ztoken>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseZtoken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub ztoken: Account<'info, Ztoken>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub ztoken: Account<'info, Ztoken>,
}

#[account]
#[derive(InitSpace)]
pub struct Ztoken {
    count: u8,
}
