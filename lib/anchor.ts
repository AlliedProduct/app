import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from './idl.json';

export const PROGRAM_ID = new PublicKey('BMcUDqQmXSQMYyo67kyih8hDrNhRrT4Fb4XXYrJzYMdm');

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'http://127.0.0.1:8899';
console.log('RPC ENDPOINT:', NETWORK);

// CampusCoin mint address
export const CAMPUSCOIN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_CAMPUSCOIN_MINT || '11111111111111111111111111111111',
);

// token decimals
export const DECIMALS = 2;
export const DECIMAL_FACTOR = Math.pow(10, DECIMALS);

export function getProgram(wallet: AnchorWallet): Program {
  const connection = new Connection(NETWORK, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  return new Program(idl as Idl, provider);
}

export const toOnChainAmount = (display: number): number => Math.round(display * DECIMAL_FACTOR);
export const toDisplayAmount = (onChain: number | bigint): number =>
  Number(onChain) / DECIMAL_FACTOR;
