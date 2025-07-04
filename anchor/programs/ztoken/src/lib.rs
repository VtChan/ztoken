#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token::{
    self,
    Mint,
    Token,
    TokenAccount,
};
use anchor_spl::associated_token::AssociatedToken;


declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod ztoken {
    use super::*;


    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let ztoken = &mut ctx.accounts.ztoken;
        ztoken.count = 0;
        Ok(())
    }

    // create a mint account
    pub fn create_mint(
        ctx: Context<CreateMint>,
        name: String,
        symbol: String,
        decimals: u8,
        init_supply: u64,
    ) -> Result<()> {
        // set mint authority
        token::set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::SetAuthority {
                    current_authority: ctx.accounts.payer.to_account_info(),
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                },
            ), 
            token::spl_token::instruction::AuthorityType::MintTokens, 
            Some(ctx.accounts.payer.key()),
        )?;

        // Mint initial supply to the token account
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                }
            ),
            init_supply,
        )?;


        // Store token metadata
        let token_metadata = &mut ctx.accounts.token_metadata;
        token_metadata.name = name;
        token_metadata.symbol = symbol;
        token_metadata.decimals = decimals;
        token_metadata.mint = ctx.accounts.mint.key();
        token_metadata.authority = ctx.accounts.payer.key();

        Ok(())
    }

    pub fn create_or_get_ata(_ctx: Context<CreateOrGetAta>) -> Result<()> {
        Ok(())
    }


    pub fn close_ata(ctx: Context<CloseAta>) -> Result<()> {
        token::close_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::CloseAccount {
                    account: ctx.accounts.user_ata.to_account_info(),
                    destination: ctx.accounts.user.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
        )?;

        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        // check insufficient fund
        let from_ata = &ctx.accounts.from_ata;
        require!(from_ata.amount >= amount, ErrorCode::InsufficientFunds);

        // transfer
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.from_ata.to_account_info(),
                    to: ctx.accounts.to_ata.to_account_info(),
                    authority: ctx.accounts.from_authority.to_account_info(),
                }
            ),
            amount,
        )?;

        Ok(())
    }


    // mint additional token
    pub fn mint_to(ctx: Context<MintTo>, amount: u64) -> Result<()> {
        // `authority` mint only
        require_keys_eq!(ctx.accounts.authority.key(), ctx.accounts.token_metadata.authority, 
            ErrorCode::Unauthorized);

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.to_ata.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                }
            ),
            amount,
        )?;

        Ok(())
    }


}
#[account]
#[derive(InitSpace)]
pub struct Ztoken {
    pub count: u8
}



#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + Ztoken::INIT_SPACE,
    )]
    pub ztoken: Account<'info, Ztoken>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct TokenMetadata {
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    pub decimals: u8,
    pub mint: Pubkey,
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        space = 8 + TokenMetadata::INIT_SPACE,
    )]
    pub token_metadata: Account<'info, TokenMetadata>,

    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct CreateOrGetAta<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the user's wallet address
    pub user: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_ata: Account<'info, TokenAccount>,


    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CloseAta<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, close = user)]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from_authority: Signer<'info>,

    #[account(mut, has_one = mint)]
    pub from_ata: Account<'info, TokenAccount>,

    #[account(mut, has_one = mint)]
    pub to_ata: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds for transfer")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub token_metadata: Account<'info, TokenMetadata>,

}