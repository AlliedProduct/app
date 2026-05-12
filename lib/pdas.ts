import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './anchor';

export function getStatePda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('state'), mint.toBuffer()], PROGRAM_ID);
}

export function getMerchantPda(merchantKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('merchant'), merchantKey.toBuffer()],
    PROGRAM_ID,
  );
}
