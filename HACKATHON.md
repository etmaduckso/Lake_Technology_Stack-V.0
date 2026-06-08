# Lake at Colosseum *Frontier* 2026

> **Tagline.** Lake — Opening digital horizons. A Bolsa de Valores Descentralizada para PMEs brasileiras, com lastro imutável no Arweave e liquidez na Solana.

## The 60-second pitch

The Brazilian small/medium-business capital market is locked behind paperwork. Issuing a structured note or fractional asset costs months of intermediation; investing in one requires accredited-investor status and an introduction. Lake collapses this to two screens:

1. A creator describes a Real World Asset, defines valuation/total tokens/treasury retention, pays in **Lake Credits** (fiat-purchased anti-Sybil ticket), and Lake **mints SPL tokens on Solana** while a relayer **uploads the legal contract to Arweave via Irys** under the platform's treasury — the creator pays no gas.
2. An investor connects a Solana wallet, browses the marketplace with **trilateral BRL/USDC/SOL pricing** (dual oracle: Pyth + Jupiter, with a 3% variance guard), and buys fractions of an asset they can read the legal anchor for.

The differentiator is not "blockchain for RWA" — it is **a Web2.5 esteira** that gives the institutional comfort of a regulated mercado (CVM compliance shape, KYC, audit log) on the immutability rails of Solana + Arweave.

## What is built today (devnet)

- Tokenization pipeline: structuring → financial engine → Arweave anchor → SPL mint
- Marketplace with trilateral pricing and wallet-gated investment thesis access
- Credit gating + AwesomeAPI USD/BRL + Pyth/Jupiter SOL/USD dual oracle
- Anchor vault program with Codama-typed bindings
- Faucet (0.05 SOL devnet, rate-limited)
- KYC + admin whitelist + immutable AuditLog
- Brand & i18n (EN/PT-BR) shipped
- Architecture documented in [ANALISE_FLUXO.md](ANALISE_FLUXO.md), security in [SECURITY.md](SECURITY.md)

---

## Track-by-track submission strategy

> **Deadlines: all target tracks below close 2026-05-12 11:59 UTC (today, ~08:59 BRT).** Confirm the wall-clock window before kicking off uploads. Tracks tagged "code work needed" are not deliverable in this window without scope risk.

### 🎯 Tier 1 — submit today, docs only

#### 1. Adevar Labs — $50,000 in Security Audit Credits
- **Why Lake fits.** Adevar's track explicitly names *DeFi, RWAs, Consumer Apps, Stablecoins* as priorities. Lake is RWA + consumer + stablecoin-adjacent.
- **What we bring.** Production-shape architecture (treasury isolation, dual-oracle guard, immutable audit), an honest gap list in [SECURITY.md](SECURITY.md), and a clear reason a professional audit unlocks mainnet cutover.
- **Submission checklist.**
  - [ ] Colosseum project link
  - [ ] Public GitHub URL
  - [ ] Technical docs ([README.md](README.md), [ANALISE_FLUXO.md](ANALISE_FLUXO.md), [SECURITY.md](SECURITY.md))
  - [ ] Project description (use the 60-second pitch above)
  - [ ] **Security Statement** — point reviewers to [SECURITY.md](SECURITY.md) §1–§7 directly
  - [ ] Pitch deck — [COLOSSEUM_FIT.html](COLOSSEUM_FIT.html) (export to PDF or share via published URL)
  - [ ] Funding stage / fundraising plan summary
- **Listing.** https://superteam.fun/earn/listing/50k-adevarlabs-bounty

#### 2. 100xDevs — Frontier Hackathon Track ($10,000)
- **Why Lake fits.** Open track, no theme restriction. They reward "real-world utility + technical quality + production readiness". Lake ships all three on devnet today.
- **Submission checklist.**
  - [ ] Colosseum project link (mandatory)
  - [ ] Public GitHub URL
  - [ ] Polished [README.md](README.md) with setup + demo link
  - [ ] 2-3 min demo video (recommend Loom)
- **Listing.** https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track

#### 3. RPC Fast — $10,000 in Infrastructure Credits
- **Why Lake fits.** Reward structure is **not** conditional on using RPC Fast during the hackathon (only the bonus tier is). Standard Colosseum submission qualifies us.
- **Submission checklist.**
  - [ ] Colosseum project link (mandatory)
  - [ ] Public GitHub repo + README + run instructions
  - [ ] Demo video or deck
  - [ ] Follow @rpcfast on X
  - [ ] Join their Telegram community chat
- **Listing.** https://superteam.fun/earn/listing/dollar10000-in-rpc-infrastructure-credits-for-colosseum-frontier-hackathon

### 🛠 Tier 2 — submit today only if the deadline is **not** today (otherwise after)

#### 4. Dune Analytics — Frontier Data Sidetrack ($6,000 SIM Enterprise plan)
- **Why Lake fits.** Lake has `AuditLog`, `payment_orders`, and on-chain SPL mints — exactly the cross-source data shape SIM normalizes. A Dune dashboard rendering Lake's tokenization volume + treasury-sponsored upload count + holder distribution is a small, demonstrable build.
- **Estimated effort.** ~2-4h: pull SIM credentials, wire one server-side fetcher in [lib/](lib/), publish a public Dune dashboard.
- **Submission checklist.**
  - [ ] Add a `/api/analytics/dune` proxy that calls SIM with our server-side key
  - [ ] Publish a Dune dashboard with at least one query against Lake's program / token mints
  - [ ] Demo of the live dashboard in the submission video
- **Listing.** https://superteam.fun/earn/listing/dune-analytics-x-superteam-earn-or-frontier-data-sidetrack

#### 5. Palm USD — Global Track ($10,000 PUSD)
- **Why Lake fits.** Palm USD is a non-freezable, USD-pegged SPL stablecoin. They want "payments, DeFi, treasury management". Lake's trilateral engine can offer PUSD as a third settlement leg next to USDC, giving creators a non-freezable receipt option.
- **Estimated effort.** ~4-6h: extend [lib/token-prices](lib/token-prices/) to fetch PUSD/USD, add PUSD to the `Networks` registry, surface a "settle in PUSD" toggle in the tokenization form.
- **Submission checklist.**
  - [ ] PUSD added as a stablecoin option in the trilateral picker
  - [ ] Pitch deck (max 12 slides) showing the integration
  - [ ] Demo video (Loom) walking through PUSD-denominated tokenization
- **Listing.** https://superteam.fun/earn/listing/palm-usd-x-superteam-uae-solana-builders-1

### 🧬 Tier 3 — mission match, code-intensive (post-Frontier roadmap)

#### 6. Encrypt & Ika — Bridgeless Capital Markets ($15,000)
- **Why this is the *ideal* track for Lake.** Their literal example reads: *"Multi-chain lending, allowing assets like Bitcoin or **RWAs from any chain as collateral for loans on Solana**."* That is the long-term Lake thesis.
- **Why not today.** Requires integrating Ika dWallets (2PC-MPC custody) and optionally Encrypt's FHE layer. Hours of integration plus design work — not safely deliverable in the deadline window.
- **Park it.** Add to the post-Frontier roadmap; revisit when Ika/Encrypt move from devnet pre-alpha to mainnet.
- **Listing.** https://superteam.fun/earn/listing/encrypt-ika-frontier-april-2026

### ⏭ Tracks intentionally skipped

- **Umbra / Cloak / MagicBlock Private Payments** — transactional privacy conflicts with CVM transparency (see [SECURITY.md](SECURITY.md) §7).
- **Tether QVAC ($10k)** — requires meaningful local-AI integration; Lake has no AI surface.
- **Eitherway ($20k)** — requires being built *inside* the Eitherway platform.
- **theMiracle ($10k)** — requires committing ≥$5k in user-facing incentives; commercial deal, not a fit adjustment.
- **SNS Identity, Zerion CLI, Torque MCP, Jupiter "Not Your Regular", KIRAPAY, SagaPad, LPAgent, dum.fun** — different product surfaces.
- **Covalent GoldRush ($3k)** — same shape as Dune, half the reward. If you ship the Dune integration the same code largely transfers; otherwise skip.

## Common assets needed across submissions

- **Repository URL.** Make sure the `cezar` branch (or `main` after merge) is public.
- **README.md.** Already in English, augmented with a hackathon header in this PR.
- **Demo video.** 2-3 minutes, Loom or YouTube unlisted. Story: open marketplace → connect wallet → pick an asset → see trilateral pricing → invest → check audit log → open the Arweave link.
- **Pitch deck.** [COLOSSEUM_FIT.html](COLOSSEUM_FIT.html) — export to PDF, host the HTML on Vercel, or both.
- **Colosseum project link.** Required by every track. Create it once at https://arena.colosseum.org and reuse.

## Cross-track integrity rules to respect

- Several tracks require the *same* Colosseum submission — that is allowed. Track-specific requirements (Adevar's security statement, Dune's SIM-using feature) must each be visible in the artifacts you submit.
- Do not let the privacy-track temptation pollute the submission narrative — the Lake pitch is *transparent compliance + immutable anchoring*. Keep the story consistent across reviewers.
- Where a track requires public artifacts (X follows, Telegram joins, post tags), batch them at the start of the submission session — they are gating, not optional.
