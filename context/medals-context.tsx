"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useWallet } from "@/context/wallet-context";
import {
  MEDALS,
  TOTAL_MEDALS,
  getMedal,
  getMedalByEvent,
  type MedalEvent,
  type MedalDefinition,
} from "@/lib/medals";

interface EarnedMedal {
  medalId: string;
  earnedAt: string;
}

interface MedalsContextValue {
  earned: EarnedMedal[];
  total: number;
  isEarned: (medalId: string) => boolean;
  award: (event: MedalEvent) => Promise<void>;
  awardById: (medalId: string) => Promise<void>;
  loading: boolean;
}

const MedalsContext = createContext<MedalsContextValue | undefined>(undefined);

const LS_KEY_PREFIX = "lake.medals.";
const ANON_KEY = "lake.medals.anon";

function storageKey(wallet: string | null | undefined): string {
  if (!wallet) return ANON_KEY;
  return `${LS_KEY_PREFIX}${wallet}`;
}

function readLocal(wallet: string | null | undefined): EarnedMedal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(wallet));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // sanity: garantir que so devolve medalhas conhecidas
    return parsed.filter(
      (m: unknown): m is EarnedMedal =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as EarnedMedal).medalId === "string" &&
        typeof (m as EarnedMedal).earnedAt === "string" &&
        !!getMedal((m as EarnedMedal).medalId),
    );
  } catch {
    return [];
  }
}

function writeLocal(wallet: string | null | undefined, earned: EarnedMedal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(wallet), JSON.stringify(earned));
  } catch {
    // quota cheia ou storage indisponivel — ignora
  }
}

export function MedalsProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useWallet();
  const [earned, setEarned] = useState<EarnedMedal[]>([]);
  const [loading, setLoading] = useState(false);
  const lastToastRef = useRef<string | null>(null);

  // Sincroniza com servidor quando wallet muda; fallback em localStorage.
  // Justificativa do disable: precisamos rehidratar a partir do localStorage
  // ao trocar de wallet — o set sincrono e o caminho mais simples e correto.
  useEffect(() => {
    let cancelled = false;

    // Sem carteira: limpa estado (zero medalhas exibidas) e encerra.
    if (!walletAddress) {
      setEarned([]);
      return;
    }

    const local = readLocal(walletAddress);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEarned(local);

    setLoading(true);
    fetch(`/api/medals?wallet=${encodeURIComponent(walletAddress)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const serverEarned: EarnedMedal[] = Array.isArray(data?.earned)
          ? data.earned.filter(
              (m: unknown): m is EarnedMedal =>
                typeof m === "object" &&
                m !== null &&
                typeof (m as EarnedMedal).medalId === "string" &&
                !!getMedal((m as EarnedMedal).medalId),
            )
          : [];

        // merge: union por medalId, mantendo earnedAt mais antigo
        const map = new Map<string, EarnedMedal>();
        for (const m of [...local, ...serverEarned]) {
          const cur = map.get(m.medalId);
          if (!cur || m.earnedAt < cur.earnedAt) {
            map.set(m.medalId, m);
          }
        }
        const merged = Array.from(map.values()).sort((a, b) =>
          a.earnedAt.localeCompare(b.earnedAt),
        );
        setEarned(merged);
        writeLocal(walletAddress, merged);
      })
      .catch(() => {
        // mantem o local
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const isEarned = useCallback(
    (medalId: string) => earned.some((m) => m.medalId === medalId),
    [earned],
  );

  // Guard por id contra disparos concorrentes (dois useEffects no mesmo tick).
  const inFlightRef = useRef<Set<string>>(new Set());

  const persist = useCallback(
    async (medal: MedalDefinition) => {
      // GUARD: medalhas só podem ser concedidas com carteira conectada
      if (!walletAddress) {
        console.warn(
          `[Medals] Tentativa de conceder '${medal.id}' sem carteira conectada. Bloqueado.`
        );
        return;
      }

      const now = new Date().toISOString();
      let actuallyAdded = false;

      setEarned((prev) => {
        if (prev.some((m) => m.medalId === medal.id)) return prev;
        actuallyAdded = true;
        const next = [...prev, { medalId: medal.id, earnedAt: now }];
        writeLocal(walletAddress, next);
        return next;
      });

      if (!actuallyAdded) return;

      // Notificacao com guard pra evitar spam quando varios disparos rapidos.
      if (lastToastRef.current !== medal.id) {
        lastToastRef.current = medal.id;
        toast.success(`Medalha conquistada: ${medal.title}`, {
          description: medal.tagline,
          duration: 4500,
        });
        setTimeout(() => {
          if (lastToastRef.current === medal.id) lastToastRef.current = null;
        }, 5000);
      }

      try {
        await fetch("/api/medals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, medalId: medal.id }),
        });
      } catch {
        // mantem so localStorage
      }
    },
    [walletAddress],
  );

  const tryAward = useCallback(
    async (medal: MedalDefinition) => {
      if (inFlightRef.current.has(medal.id)) return;
      inFlightRef.current.add(medal.id);
      try {
        await persist(medal);
      } finally {
        inFlightRef.current.delete(medal.id);
      }
    },
    [persist],
  );

  const awardById = useCallback(
    async (medalId: string) => {
      const medal = getMedal(medalId);
      if (!medal) return;
      await tryAward(medal);
    },
    [tryAward],
  );

  const award = useCallback(
    async (event: MedalEvent) => {
      const medal = getMedalByEvent(event);
      if (!medal) return;
      await tryAward(medal);
    },
    [tryAward],
  );

  const value = useMemo(
    () => ({
      earned,
      total: TOTAL_MEDALS,
      isEarned,
      award,
      awardById,
      loading,
    }),
    [earned, isEarned, award, awardById, loading],
  );

  return (
    <MedalsContext.Provider value={value}>{children}</MedalsContext.Provider>
  );
}

export function useMedals(): MedalsContextValue {
  const ctx = useContext(MedalsContext);
  if (!ctx) {
    throw new Error("useMedals deve ser usado dentro de <MedalsProvider>");
  }
  return ctx;
}

export { MEDALS };
