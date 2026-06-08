"use client";

import { useMemo } from "react";
import {
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  type WalletAdapter,
} from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SolanaConnectionAdapter } from "@/components/SolanaConnectionAdapter";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => {
    const adapters: WalletAdapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];
    const enableUnsafeBurner =
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_UNSAFE_BURNER === "true";

    if (enableUnsafeBurner) {
      adapters.push(new UnsafeBurnerWalletAdapter());
    }

    return adapters;
  }, []);

  return (
    // SolanaConnectionAdapter lê o solanaRpcUrl do NetworkContext
    // e instancia o ConnectionProvider com o endpoint correto.
    // Deve estar dentro do NetworkProvider (garantido pelo layout.tsx).
    <SolanaConnectionAdapter>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error) => console.error("[Wallet Error]", error)}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </SolanaConnectionAdapter>
  );
}
