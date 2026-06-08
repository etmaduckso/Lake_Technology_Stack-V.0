# Lake — Security Architecture

Lake is a Real World Asset (RWA) tokenization platform on Solana with permanent document anchoring on Arweave. This document describes the security model, the threats we considered while designing it, and the gaps we acknowledge openly to professional auditors and reviewers.

> **Disclosure context.** This statement is written for the Colosseum *Frontier* hackathon and for security partners (Adevar Labs and similar). We intentionally describe *what is implemented today* and *what is intentionally deferred* so that auditors can scope their work without surprise.

## 1. Threat model

The assets Lake protects, in order of priority:

1. **Treasury keypair** — the on-chain signer that funds Arweave uploads and the devnet faucet. Compromise means an attacker can drain SOL, forge document anchors, or impersonate the platform on-chain.
2. **Tokenized RWA integrity** — the chain of custody between (a) the off-chain legal contract, (b) its Arweave transaction id, and (c) the SPL token representing fractional ownership. Compromise means a token can be sold without a real legal anchor behind it.
3. **Credit ledger** — gates expensive on-chain operations. Compromise means free tokenization, which is both an economic and a Sybil risk.
4. **User wallet sessions** — Web3 auth gates investor access. Compromise means unauthorized purchases from a victim's wallet (mitigated because the wallet itself signs every transfer; we cannot move funds for the user).
5. **Investor confidentiality at the application layer** — KYC records, user metadata, audit trail. Compromise is a regulatory and reputational event.

We are **not** trying to defend against:

- A user willingly handing their seed phrase to a third party.
- A creator publishing fraudulent legal contracts (Arweave anchors *what* was uploaded, not whether it is true — see §6).
- A motivated state-level adversary with chain-analysis resources defeating pseudonymity (Lake is transparent by design; see §7).

## 2. Trust boundary diagram

```
┌─────────────────────────┐   wallet-signed tx (no key custody)   ┌────────────────────────┐
│ Browser / Phantom etc.  │ ─────────────────────────────────────▶│   Solana program       │
└──────────┬──────────────┘                                       │   anchor/programs/vault │
           │ HTTPS                                                └────────────┬───────────┘
           │ (signed session, no PII)                                          │
           ▼                                                                   │
┌─────────────────────────────────────────────┐                                │
│ Next.js API Routes  (app/api/*)             │                                │
│ - reads/writes Prisma (PostgreSQL)          │                                │
│ - signs Irys uploads via TREASURY key       │ ──── Arweave (Irys relayer) ───┘
│ - rate-limits faucet                        │
│ - dual-oracle pricing guard                 │
│ - reads ENV (never returns secrets)         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ PostgreSQL       │
        │ (Supabase)       │
        └──────────────────┘
```

The treasury private key, the database connection string, and the Irys signer **never** cross the browser boundary. Every action that needs them is invoked via an API route that re-derives authorization from the wallet signature on the request side and the session record on the database side.

## 3. Controls implemented today

### 3.1 Treasury isolation
- `WALLET_TREASURY_PRIVATE_KEY` (and `IRYS_PRIVATE_KEY` in the dev profile) lives only in server-side env. It is loaded once by [lib/storage/irys](lib/storage/irys/) and [lib/solana-bot](lib/solana-bot/) and is never serialized into a response.
- Next.js API routes are the only call site. There is no client bundle import path that resolves to those modules.
- Treasury *signs* Irys/Arweave uploads; it does *not* hold investor SPL tokens. Investor positions are owned by the investor's own wallet.

### 3.2 Dual-oracle pricing guard
- SOL/USD pricing is read from **Pyth** on-chain and **Jupiter v3** in parallel ([lib/solana-oracle](lib/solana-oracle/)).
- If the two oracles diverge by more than **3%**, the trade path refuses to quote rather than proceed with stale or manipulated data. This kills the "oracle attack ⇒ underpriced burn" class of attacks at the source.
- USD/BRL is read from AwesomeAPI; this is fiat reference data, so a divergence guard is unnecessary but cache TTLs are short to avoid stale FX.

### 3.3 Faucet rate-limiting
- Devnet SOL faucet is capped at **0.05 SOL per request, 2 successful claims per wallet** in [app/api/faucet](app/api/faucet/).
- Quota is currently held in process memory — see §5 for the durability gap.

### 3.4 Credit gating
- Tokenization, the most expensive op (Arweave upload + on-chain mint), is gated by the **Lake credit** balance recorded in Prisma (`User.credits` + `user_credits`/`credit_ledger`).
- Credit decrement is server-side and wrapped in a transaction so that a failed mint does not silently consume credit.

### 3.5 KYC + admin whitelist
- Asset publishing requires a `KycRecord` row tied to the publisher wallet.
- Privileged endpoints (admin/check, manual credit grants) are gated by `AdminWhitelist` membership, evaluated server-side. The frontend `<AdminBadge>` is a *visual* hint only — server checks are the source of truth.

### 3.6 Immutable audit trail
- Every credit movement, tokenization, and admin action writes to `AuditLog`.
- Document anchors are written to Arweave via Irys with `App-Name = "Lake"` tag so the corpus is queryable forever, independent of the off-chain database.

### 3.7 Safe currency math
- Frontend uses `Intl.NumberFormat` exclusively. We never apply JS `Number` arithmetic on currency values, eliminating the "trillions display becomes `e+12`" and floating-point dust accumulation classes of UI bug.

### 3.8 Wallet auth on investment path
- The buy-tokens path checks for an active wallet signature *server-side* before quoting or accepting an order. Replays and ghost orders cannot bypass this.

## 4. Anchor program

The on-chain vault program lives in [anchor/programs/vault](anchor/programs/vault/). It is generated with Codama bindings ([scripts](#) — `npm run codama:js`) so that the TypeScript client and the program IDL stay in lockstep.

Status:
- Built and tested on **devnet**.
- No formal third-party audit yet — this is the primary reason we are applying to the Adevar Labs audit-credits track.

## 5. Acknowledged gaps (please target these)

We are publishing these openly so that auditors can prioritize:

1. **Faucet quota is in-process memory.** Restarting the API server resets quotas. Migration to a durable store (Redis / Prisma `FaucetClaim` table) is queued.
2. **Credit ledger has two representations.** `User.credits` (denormalized) and `user_credits` / `credit_ledger` (event-sourced) coexist. Consolidation is planned but the dual write is a consistency risk under contention.
3. **No on-chain audit yet.** The vault program has unit tests but no professional review of CPI surface, account validation, or rent/space assumptions.
4. **Dependency surface is large.** Full Radix/shadcn UI tree means a wide npm dependency graph. We pin via lockfile but do not yet run automated SCA (Snyk / Dependabot policy) on every PR.
5. **No formal pentest of the API surface.** Rate limiting beyond the faucet endpoint is per-route ad-hoc rather than centralized middleware.
6. **CSRF / origin checks.** Same-site cookies + wallet-signed requests cover the common case but we have not yet codified an origin allowlist for the credit/admin endpoints.
7. **Webhook ingestion** (`webhook_logs` table) accepts payment confirmations from external providers. Signature verification is required at integration time and should be re-reviewed when going to mainnet.

## 6. What Arweave does and does not prove

Lake anchors the *bytes of a legal document* to Arweave at tokenization time. This proves:

- The document existed at that timestamp.
- It has not been tampered with after upload.
- The treasury key authorized the upload.

It does **not** prove:

- The legal document is enforceable, registered with CVM, or accurate.
- The underlying real-world asset exists or has the claimed value.

Off-chain due diligence (KYC, asset registration, CVM compliance) remains a human/legal process. Lake's value-add is *making the artifacts of that process immutable and queryable*, not replacing the process.

## 7. Why Lake does *not* use privacy primitives

Several Frontier side tracks (Umbra, Cloak, MagicBlock Private Payments) reward transactional privacy. Lake intentionally does **not** adopt these for the core flow because:

- CVM (Comissão de Valores Mobiliários, Brazil's SEC) compliance for a securities-like RWA platform requires that the public ledger of issuances and transfers be auditable.
- Investor protection in Brazil is built on transparency of allocation, valuation, and counterparty — the exact information privacy primitives hide.

Privacy *for KYC data and PII* — distinct from transactional privacy — is handled at the application layer (encrypted-at-rest fields, scoped admin access). That is a future hardening target.

## 8. Reporting a vulnerability

For now, report security issues by email to the team mailbox referenced in the project's `CONTACT` (omitted from the public repo to avoid scraping). Please give us a 30-day disclosure window before public publication — Lake is pre-mainnet and disclosure during the devnet phase has limited user impact, but the team commits to crediting reporters.

A formal `security.txt` and a coordinated disclosure program will land before mainnet cutover.
