/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useCallback } from 'react';
import { BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getProgram, CAMPUSCOIN_MINT, toOnChainAmount, toDisplayAmount } from '../lib/anchor';
import { getStatePda, getMerchantPda } from '../lib/pdas';

export function useCampusCoin() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const program = useMemo(() => {
    if (!wallet) return null;
    return getProgram(wallet);
  }, [wallet]);

  // read: get user bal
  const getBalance = useCallback(
    async (owner?: PublicKey): Promise<number> => {
      if (!wallet) return 0;
      const target = owner || wallet.publicKey;
      try {
        const ata = await getAssociatedTokenAddress(CAMPUSCOIN_MINT, target);
        const account = await getAccount(connection, ata);
        return toDisplayAmount(account.amount);
      } catch {
        return 0;
      }
    },
    [wallet, connection],
  );

  // 1: init_campus (admin only, 1 time)
  const initCampus = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    const [statePda] = getStatePda(CAMPUSCOIN_MINT);

    const tx = await program.methods
      .initCampus()
      .accounts({
        state: statePda,
        admin: wallet.publicKey,
        mint: CAMPUSCOIN_MINT,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }, [program, wallet]);

  // 2: register_merchant (admin only)
  const registerMerchant = useCallback(
    async (merchantPubkey: PublicKey) => {
      if (!program || !wallet) throw new Error('Wallet not connected');
      const [statePda] = getStatePda(CAMPUSCOIN_MINT);
      const [merchantPda] = getMerchantPda(merchantPubkey);

      const tx = await program.methods
        .registerMerchant()
        .accounts({
          state: statePda,
          merchant: merchantPda,
          merchantKey: merchantPubkey,
          admin: wallet.publicKey,
          mint: CAMPUSCOIN_MINT,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet],
  );

  // 3: pay_merchant (any student)
  const payMerchant = useCallback(
    async (merchantOwnerPubkey: PublicKey, displayAmount: number) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      const [statePda] = getStatePda(CAMPUSCOIN_MINT);
      const [merchantPda] = getMerchantPda(merchantOwnerPubkey);

      // derive ATAs
      const payerAta = await getAssociatedTokenAddress(CAMPUSCOIN_MINT, wallet.publicKey);
      const merchantAta = await getAssociatedTokenAddress(CAMPUSCOIN_MINT, merchantOwnerPubkey);

      // if merchant ATA doesnt exist yet, create it first
      const ataInfo = await connection.getAccountInfo(merchantAta);
      const preInstructions = [];
      if (!ataInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer (student pays the account creation fee)
            merchantAta, // ATA to create
            merchantOwnerPubkey, // owner of the ATA
            CAMPUSCOIN_MINT, // mint
          ),
        );
      }

      const tx = await program.methods
        .payMerchant(new BN(toOnChainAmount(displayAmount)))
        .accounts({
          payer: wallet.publicKey,
          payerAta,
          merchantAta,
          mint: CAMPUSCOIN_MINT,
          state: statePda,
          merchant: merchantPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    },
    [program, wallet, connection],
  );

  // 4: earn_reward (admin only, mints to student)
  const earnReward = useCallback(
    async (studentPubkey: PublicKey, displayAmount: number) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      const [statePda] = getStatePda(CAMPUSCOIN_MINT);
      const studentAta = await getAssociatedTokenAddress(CAMPUSCOIN_MINT, studentPubkey);

      const ataInfo = await connection.getAccountInfo(studentAta);
      const preInstructions = [];
      if (!ataInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            studentAta, // ata
            studentPubkey, // owner
            CAMPUSCOIN_MINT, // mint
          ),
        );
      }

      const tx = await program.methods
        .earnReward(new BN(toOnChainAmount(displayAmount)))
        .accounts({
          userAta: studentAta,
          mint: CAMPUSCOIN_MINT,
          state: statePda,
          admin: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      return tx;
    },
    [program, wallet, connection],
  );

  // read: check if merchant is registered
  const isMerchantRegistered = useCallback(
    async (merchantPubkey: PublicKey): Promise<boolean> => {
      if (!program) return false;
      const [merchantPda] = getMerchantPda(merchantPubkey);
      try {
        const acc = await (program.account as any).merchant.fetch(merchantPda);
        return acc.allowed === true;
      } catch {
        return false;
      }
    },
    [program],
  );

  // read: get all registered merchants
  const getAllMerchants = useCallback(async () => {
    if (!program) return [];
    const all = await (program.account as any).merchant.all();
    return all.map((m: any) => ({
      pda: m.publicKey.toBase58(),
      merchant: m.account.merchant.toBase58(),
      allowed: m.account.allowed,
    }));
  }, [program]);

  return {
    program,
    wallet,
    connected: !!wallet,
    // reads
    getBalance,
    isMerchantRegistered,
    getAllMerchants,
    // writes
    initCampus,
    registerMerchant,
    payMerchant,
    earnReward,
  };
}
