import type { Metadata } from "next";
import { Inter, Nunito, EB_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SolanaProvider } from "@/components/SolanaProvider";
import { WalletProvider } from "@/context/wallet-context";
import { CreditsProvider } from "@/context/credits-context";
import { MedalsProvider } from "@/context/medals-context";
import { CreditsModal } from "@/components/CreditsModal";
import { LocaleProvider } from "@/lib/i18n/client";
import { getServerDict } from "@/lib/i18n/server";
import { Footer } from "@/components/Footer";
import { GlobalTicker } from "@/components/GlobalTicker";
// ── Fase 2: Motor de Roteamento Multi-Network ──
import { NetworkProvider } from "@/context/NetworkContext";

const inter = Inter({ subsets: ["latin"] });

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerDict();
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getServerDict();
  const htmlLang = locale === "pt-BR" ? "pt-br" : "en";
  return (
    <html lang={htmlLang} className={`${nunito.variable} ${ebGaramond.variable}`}>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`}>
        <LocaleProvider locale={locale}>
          {/*
            NetworkProvider deve estar ACIMA do SolanaProvider.
            O SolanaConnectionAdapter (dentro do SolanaProvider) consome
            o useNetworkHub() para determinar qual RPC Solana usar.
          */}
          <NetworkProvider>
            <SolanaProvider>
              <WalletProvider>
                <CreditsProvider>
                  <MedalsProvider>
                    {/* ── Ticker Global de cotação SOL/BRL ── */}
                    <GlobalTicker />
                    <Navbar />
                    <main className="flex-grow w-full">{children}</main>
                    <Footer />
                    <CreditsModal />
                    <Toaster position="bottom-right" richColors closeButton />
                  </MedalsProvider>
                </CreditsProvider>
              </WalletProvider>
            </SolanaProvider>
          </NetworkProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
