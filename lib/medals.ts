// Catalogo das medalhas Lake.
// Cada fase do treinamento equivale a uma "lamina" da logo Lake.
// Cores derivadas do tailwind.config.ts (lake.coral/lilac/lime/mint/turquoise/cyan).
// PPTX referencia: "Cada parte da logo representa uma etapa do treinamento".

export type MedalPhase = 1 | 2 | 3 | 4 | 5 | "PRO";

export interface MedalDefinition {
  id: string;
  phase: MedalPhase;
  label: string;
  title: string;
  tagline: string;
  color: string; // hex
  ringClass: string; // tailwind ring color
  bgClass: string; // tailwind bg
  textClass: string; // tailwind text
  borderClass: string; // tailwind border
  description: string;
  criteria: string;
  anchorId: string; // ancora dentro de /learn
  unlocksWith: MedalEvent; // como ela e ganha
}

// Eventos que o cliente dispara para destravar medalhas.
export type MedalEvent =
  | "rwa_intro_read"
  | "wallet_connected"
  | "faucet_claimed"
  | "asset_browsed"
  | "asset_tokenized"
  | "credits_purchased"
  | "pro_unlocked";

export const MEDALS: MedalDefinition[] = [
  {
    id: "fase-1-fundamentos",
    phase: 1,
    label: "Fase 1",
    title: "Fundamentos RWA",
    tagline: "Voce entendeu o que e tokenizacao.",
    color: "#EA6262", // lake.coral
    ringClass: "ring-lake-coral",
    bgClass: "bg-lake-coral",
    textClass: "text-lake-coral",
    borderClass: "border-lake-coral",
    description:
      "Voce conhece o que sao Real World Assets, fracionamento e liquidez 24/7.",
    criteria: "Ler a secao 'A Revolucao RWA' na pagina Aprenda.",
    anchorId: "intro-rwa",
    unlocksWith: "rwa_intro_read",
  },
  {
    id: "fase-2-carteira",
    phase: 2,
    label: "Fase 2",
    title: "Sua Primeira Carteira",
    tagline: "Voce conectou uma wallet a Lake.",
    color: "#BF80C3", // lake.lilac
    ringClass: "ring-lake-lilac",
    bgClass: "bg-lake-lilac",
    textClass: "text-lake-lilac",
    borderClass: "border-lake-lilac",
    description:
      "Voce conectou Phantom/Solflare e entendeu o conceito de seed phrase.",
    criteria: "Conectar uma carteira Solana valida.",
    anchorId: "wallet-masterclass",
    unlocksWith: "wallet_connected",
  },
  {
    id: "fase-3-faucet",
    phase: 3,
    label: "Fase 3",
    title: "Devnet Explorer",
    tagline: "Voce pegou SOL de teste no faucet Lake.",
    color: "#E6F097", // lake.lime
    ringClass: "ring-lake-lime",
    bgClass: "bg-lake-lime",
    textClass: "text-lake-ink",
    borderClass: "border-lake-lime",
    description: "Voce executou seu primeiro request de devnet SOL.",
    criteria: "Pedir 0.05 SOL no LakeFaucet com sucesso.",
    anchorId: "faucets",
    unlocksWith: "faucet_claimed",
  },
  {
    id: "fase-4-marketplace",
    phase: 4,
    label: "Fase 4",
    title: "Investidor RWA",
    tagline: "Voce explorou o marketplace.",
    color: "#9BDFA0", // lake.mint
    ringClass: "ring-lake-mint",
    bgClass: "bg-lake-mint",
    textClass: "text-lake-ink",
    borderClass: "border-lake-mint",
    description:
      "Voce abriu o marketplace e analisou pelo menos um ativo listado.",
    criteria: "Visitar o detalhe de um ativo no marketplace.",
    anchorId: "identity",
    unlocksWith: "asset_browsed",
  },
  {
    id: "fase-5-tokenizador",
    phase: 5,
    label: "Fase 5",
    title: "Tokenizador",
    tagline: "Voce tokenizou seu primeiro ativo.",
    color: "#94D8D3", // lake.turquoise
    ringClass: "ring-lake-turquoise",
    bgClass: "bg-lake-turquoise",
    textClass: "text-lake-ink",
    borderClass: "border-lake-turquoise",
    description:
      "Voce gerou um ativo on-chain via formulario de tokenizacao.",
    criteria: "Submeter o formulario em /tokenize com sucesso.",
    anchorId: "lakezero",
    unlocksWith: "asset_tokenized",
  },
  {
    id: "fase-pro-institucional",
    phase: "PRO",
    label: "PRO",
    title: "Lake PRO",
    tagline: "Voce atingiu o modo institucional.",
    color: "#29ABE2", // lake.cyan (LakeBlue principal)
    ringClass: "ring-lake-cyan",
    bgClass: "bg-lake-cyan",
    textClass: "text-white",
    borderClass: "border-lake-cyan",
    description:
      "Operacao institucional: KYC concluido + creditos adquiridos.",
    criteria: "Concluir KYC e adquirir creditos Lake.",
    anchorId: "juridico",
    unlocksWith: "pro_unlocked",
  },
];

export const MEDAL_BY_EVENT: Record<MedalEvent, MedalDefinition> = MEDALS.reduce(
  (acc, m) => {
    acc[m.unlocksWith] = m;
    return acc;
  },
  {} as Record<MedalEvent, MedalDefinition>
);

export function getMedal(id: string): MedalDefinition | undefined {
  return MEDALS.find((m) => m.id === id);
}

export function getMedalByEvent(event: MedalEvent): MedalDefinition {
  return MEDAL_BY_EVENT[event];
}

export const TOTAL_MEDALS = MEDALS.length;
