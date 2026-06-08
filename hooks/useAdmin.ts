import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { MASTER_WALLETS } from "@/config/adminWallets";
import { useMemo } from "react";

// Mock list of regular admins for testing
const REGULAR_ADMINS: readonly string[] = [
  "AdMin4uYmP9bx5SyFhHEry7b98bPLb74BsADdbhe4o5d",
  "LakeAmba55ad0r789XyZ1234567890123456789"
] as const;

export function useAdmin() {
  const { publicKey, connected } = useSolanaWallet();
  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const isConnected = connected;

  const { isMaster, isAdmin } = useMemo(() => {
    const master = isConnected && !!walletAddress && MASTER_WALLETS.includes(walletAddress);
    const admin = master || (isConnected && !!walletAddress && REGULAR_ADMINS.includes(walletAddress));
    return { isMaster: master, isAdmin: admin };
  }, [walletAddress, isConnected, publicKey, connected]);

  return {
    isMaster,
    isAdmin,
    walletAddress,
    isConnected,
    publicKey,
    connected,
  };
}
