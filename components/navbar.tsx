"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletControl } from "@/components/wallet-control";
import AdminBadge from "@/components/admin/AdminBadge";
import { LocaleToggle } from "@/components/locale-toggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useDict } from "@/lib/i18n/client";
import { useRequireWallet } from "@/hooks/useRequireWallet";
import { useRouter } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dict = useDict();
  const requireWallet = useRequireWallet();
  const router = useRouter();

  // Rotas de navegação — preservando "Meu Portfólio" da nossa main + i18n do Cezar
  const navItems = [
    { name: dict.nav.home, href: "/" },
    { name: dict.nav.trail, href: "/trail" },
    { name: dict.nav.learn, href: "/learn" },
    { name: dict.nav.marketplace, href: "/marketplace" },
    { name: dict.nav.tokenize, href: "/tokenize" },
    { name: dict.nav.portfolio, href: "/dashboard/investor" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">

        {/* 1. LOGO Lake (Esquerda) */}
        <Link href="/" className="flex items-center gap-3 z-50 group">
          <Image
            src="/brand/lake-logo-light.png"
            alt="Lake — Opening digital horizons"
            width={132}
            height={42}
            priority
            className="h-10 w-auto transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        {/* 2. MENU DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.href === "/dashboard/investor") {
                  e.preventDefault();
                  requireWallet(() => {
                    router.push(item.href);
                  });
                }
              }}
              className={cn(
                "text-sm font-bold transition-colors hover:text-lake-cyan",
                pathname === item.href
                  ? "text-lake-cyan-dark"
                  : "text-slate-600"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* 3. AÇÕES DESKTOP (Direita) */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleToggle />
          <AdminBadge />
          <WalletControl />
        </div>

        {/* 4. BOTÃO MENU MOBILE */}
        <div className="md:hidden flex items-center gap-3">
          <LocaleToggle compact />
          <div className="scale-75 origin-right">
            <AdminBadge />
          </div>
          <button
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={dict.nav.menu}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 5. PAINEL MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl flex flex-col p-4 gap-4 animate-in slide-in-from-top-5 fade-in-20">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (item.href === "/dashboard/investor") {
                    e.preventDefault();
                    requireWallet(() => {
                      router.push(item.href);
                    });
                  }
                }}
                className={cn(
                  "px-4 py-3 rounded-xl text-base font-bold transition-colors border border-transparent",
                  pathname === item.href
                    ? "bg-lake-cyan-soft text-lake-cyan-dark border-lake-cyan-light/40"
                    : "text-slate-700 hover:bg-slate-50 hover:border-slate-100"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="h-px bg-slate-100 my-1" />

          <div className="flex justify-center pb-2">
            <div className="w-full [&>button]:w-full [&>button]:justify-center">
              <WalletControl />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
