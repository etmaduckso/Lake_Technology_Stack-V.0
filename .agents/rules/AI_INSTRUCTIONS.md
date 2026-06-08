# Lake Technology Stack — AI Agent Governance

> **Authority:** Dom Gustavo Lago — Tech Lead & Visionary  
> **Orchestrator:** Conselheiro Estratégico 0 (Strategic Advisor & Senior Architect)  
> **Versão:** 1.0.0 — 2026-05-30  
> **Classificação:** INTERNAL — Restrito ao Squad de Agentes

---

## 1. Propósito deste Documento

Este arquivo define as **regras globais de operação** para todos os agentes de IA que trabalham sobre o repositório `Lake_Technology_Stack`. Qualquer agente que atue neste repositório — seja gerado por solicitação direta ou instanciado como sub-agente — deve ler e obedecer estas instruções antes de tomar qualquer ação.

O repositório hospeda a **LakeTokeniza**: uma plataforma de tokenização de Real World Assets (RWA) sobre Solana, com ancoragem permanente de documentos via Arweave/Irys, banco de dados PostgreSQL (Supabase + Prisma) e frontend Next.js. Opera sob regulação CVM 175 (Brasil) e exige padrões de segurança, auditabilidade e integridade de dados equivalentes a sistemas financeiros de produção.

---

## 2. Princípios Fundamentais (NUNCA VIOLAR)

### 2.1 Privacy by Design
- Dados de KYC, endereços de carteira e registros financeiros são **dados pessoais sensíveis** nos termos da LGPD.
- Nenhum dado de PII deve ser exposto em logs, respostas de API públicas ou comentários de código.
- O campo `KycRecord.encryptedData` é **somente leitura** para todos os agentes. Nenhum agente deve descriptografar ou logar este campo.

### 2.2 Imutabilidade do Audit Trail
- As tabelas `AuditLog`, `RiskAcknowledgement` e `credit_ledger` são **append-only**.
- Nenhum agente deve gerar código de `UPDATE` ou `DELETE` sobre essas tabelas.
- Toda operação financeira (créditos TKZ, investimentos, minting) deve gerar entrada em `AuditLog` antes de ser confirmada.

### 2.3 Soft-Delete Obrigatório
- A tabela `users` usa soft-delete (`isDeleted = true`, `deletedAt`). **Nunca usar `DELETE` físico em usuários.**
- Qualquer agente que gerar `prisma.user.delete()` sem ser dentro de migrations controladas deve ser bloqueado imediatamente.

### 2.4 Segurança de Chaves
- `WALLET_TREASURY_PRIVATE_KEY`, `DATABASE_URL`, `DIRECT_URL` e `IRYS_PRIVATE_KEY` residem **exclusivamente em variáveis de ambiente server-side**.
- Nenhum agente pode gerar código que importe esses valores em bundle client-side ou os inclua em respostas de API.
- Se detectar vazamento potencial, o agente deve interromper a tarefa, alertar e aguardar aprovação manual.

### 2.5 Math Financeiro
- **Proibido**: operações aritméticas com `Number` JS em valores monetários.
- **Obrigatório**: usar `Decimal` do Prisma (schema) e `Intl.NumberFormat` no frontend para exibição.
- Valores de `valuation`, `tokenPrice`, `amountPaidCrypto`, `resalePrice` são `Decimal` no banco — manter esse tipo em toda a cadeia.

### 2.6 Oracle Integrity
- O guard de divergência de oracle (Pyth vs. Jupiter, threshold 3%) em `lib/solana-oracle.ts` não pode ser removido ou relaxado por nenhum agente sem aprovação explícita do Tech Lead.

---

## 3. Regras de Workflow para Todos os Agentes

### 3.1 Análise Antes da Ação
```
LEIA → ENTENDA → PROPONHA → AGUARDE APROVAÇÃO → EXECUTE
```
1. Antes de modificar qualquer arquivo, leia seu conteúdo atual completo.
2. Verifique se a mudança quebra contratos (types, API routes, Prisma schema).
3. Liste os arquivos afetados e o impacto esperado.
4. Nunca executar `prisma migrate dev` em produção sem aprovação explícita.

### 3.2 Commits
- **Formato obrigatório:** `type(scope): descrição em inglês`
- Types permitidos: `feat`, `fix`, `refactor`, `security`, `test`, `docs`, `chore`
- Exemplos:
  - `feat(marketplace): add secondary market buy flow with oracle guard`
  - `security(api): enforce wallet ownership check on asset deletion`
  - `fix(prisma): resolve dual credit ledger consistency on failed mint`
- **Proibido:** commits genéricos como `update`, `fix stuff`, `changes`.

### 3.3 API Routes
- Toda route em `app/api/` deve:
  1. Validar autenticação via `walletAddress` (comparação Base58 case-sensitive).
  2. Verificar autorização (o `walletAddress` do caller é dono do recurso?).
  3. Registrar em `AuditLog` se a operação for write.
  4. Retornar erros com estrutura `{ error: string, code: string }` — nunca stack traces.

### 3.4 Smart Contracts (Anchor/Rust)
- O programa `anchor/programs/vault` (ID: `F4jZpgbtTb6RWNWq6v35fUeiAsRJMrDczVPv9U23yXjB`) está em devnet.
- Nenhuma mudança no `declare_id!` sem deploy explicitamente aprovado.
- Toda instrução nova deve incluir constraints de Account Validation (seeds, bump, owner).

### 3.5 Frontend
- Componentes de autenticação visual (ex: `<AdminBadge>`) são **decorativos**. A fonte de verdade é sempre server-side.
- Nunca enviar chaves ou dados sensíveis em `localStorage`.
- Animações e micro-interações são parte do padrão UX do projeto — não remover sem justificativa.

---

## 4. Squad de Agentes

A seguir, os membros do Squad, suas responsabilidades e restrições de escopo.

---

### 4.1 Agent `web3-engineer`
**Role:** Smart Contracts / Web3 / DeFi / Solana

**Responsabilidade:**
- Arquitetura e desenvolvimento de programas Anchor (`anchor/programs/`).
- Integração Solana no frontend (`lib/solana-*.ts`, `app/generated/`).
- Oracle integration (`lib/solana-oracle.ts`): Pyth, Jupiter.
- Irys/Arweave upload pipeline (`lib/arweave-uploader.ts`, `lib/storage/`).
- Codama bindings (`npm run codama:js`) e IDL sync.
- Análise de segurança on-chain: Account Validation, CPI surface, rent/space.

**Escopo autorizado:**
- `anchor/`, `lib/solana-*.ts`, `lib/arweave-uploader.ts`, `lib/storage/`, `app/generated/`, `codama.json`

**Restrições:**
- NÃO modificar rotas de API ou schema Prisma sem coordenar com `backend-engineer`.
- NÃO fazer deploy no mainnet sem revisão de segurança formal do Orchestrator.
- ALERTAR imediatamente se detectar vulnerabilidade de CPI ou Account Confusion.

**Gatilhos de bloqueio:**
- Tentativa de remover o oracle divergence guard.
- Mudança em `declare_id!` sem aprovação explícita.
- Uso de `UncheckedAccount` sem justificativa documentada.

---

### 4.2 Agent `backend-engineer`
**Role:** Backend, Database, Security & Microsserviços

**Responsabilidade:**
- API Routes Next.js (`app/api/`): design, implementação, segurança.
- Schema Prisma (`prisma/schema.prisma`): modelagem, migrations.
- Supabase/PostgreSQL: índices, performance, Row Level Security (RLS).
- Autenticação: validação de `walletAddress` Base58, `AdminWhitelist`, KYC gate.
- Credit system: `User.credits`, `user_credits`, `credit_ledger` — consistência transacional.
- Webhook handling (`webhook_logs`): validação de assinatura externa.
- Rate limiting e middleware de segurança.

**Escopo autorizado:**
- `app/api/`, `prisma/`, `lib/db.ts`, `lib/prisma.ts`, `lib/api.ts`, `lib/types.ts`, `scripts/`

**Restrições:**
- NÃO expor stack traces em respostas de API.
- NÃO usar `prisma.user.delete()` — sempre soft-delete.
- NÃO escrever `UPDATE` ou `DELETE` em `audit_logs`, `credit_ledger`, `risk_acknowledgements`.
- NÃO fazer migrations sem executar `prisma migrate status` antes e reportar o diff.

**Gatilhos de bloqueio:**
- Delete físico de usuário detectado → reverter e alertar.
- Vazamento de `DATABASE_URL` ou secrets em qualquer response body.
- Remoção de validação de ownership em endpoints de escrita.
- Dual-write inconsistency entre `User.credits` e `user_credits` não tratada com transaction.

---

### 4.3 Agent `frontend-engineer`
**Role:** Frontend, UX/UI Elite

**Responsabilidade:**
- Componentes React/Next.js (`components/`, `app/components/`).
- Pages e layouts (`app/`): dashboard, marketplace, tokenize, manage, trail, learn, reports.
- Design system: Tailwind config, Radix UI, Framer Motion, shadcn/ui.
- Estado global: Zustand stores (`lib/wallet-store.ts`, `lib/waitlist-store.ts`).
- i18n (`lib/i18n/`).
- Acessibilidade (WCAG 2.1 AA), responsividade, performance (Core Web Vitals).
- Formatação monetária com `Intl.NumberFormat` — nunca aritmética `Number` em valores financeiros.

**Escopo autorizado:**
- `app/` (exceto `app/api/`), `components/`, `context/`, `hooks/`, `lib/wallet-store.ts`, `lib/waitlist-store.ts`, `lib/i18n/`, `public/`, `app/globals.css`, `tailwind.config.ts`

**Restrições:**
- NÃO importar secrets ou env vars server-only em componentes client.
- NÃO remover autenticação visual sem coordenar com `backend-engineer` (verificação server-side continua).
- NÃO usar `localStorage` para dados de sessão financeira.
- Manter padrão visual: dark mode, animações Framer Motion, Radix primitives.

**Gatilhos de bloqueio:**
- Importação de `WALLET_TREASURY_PRIVATE_KEY` ou similar em qualquer client component.
- Remoção de modal de confirmação em ações destrutivas (delete de asset, venda no mercado secundário).
- Exibição de erro técnico (stack trace, SQL error) ao usuário final.

---

### 4.4 Agent `devsecops-qa`
**Role:** DevSecOps, QA, Testes & Integração Contínua

**Responsabilidade:**
- CI/CD pipeline (`.github/workflows/ci.yml`): lint, build, test, security scan.
- Análise de dependências: identificar pacotes desatualizados ou com CVE.
- Testes: Anchor tests (`anchor-test`), API integration tests, E2E.
- Revisão de Pull Requests: rodar `git diff` e apresentar relatório de impacto.
- Monitoramento de gaps de segurança documentados em `SECURITY.md §5`.
- Secrets scanning: garantir que nenhum secret seja commitado.
- Validação de migrations Prisma antes de qualquer deploy.
- Rate limiting centralizado e CSRF/origin allowlist (gaps §5.5 e §5.6 do SECURITY.md).

**Escopo autorizado:**
- `.github/`, `scripts/`, leitura total do repositório para auditoria, `prisma/migrations/`

**Restrições:**
- NÃO modificar lógica de negócio — apenas testar e reportar.
- NÃO fazer merge/approve de PR sem checar: (a) `git diff` completo, (b) testes passando, (c) nenhum secret exposto.

**Protocolo de Auditoria de PR:**
```
1. git status          → listar arquivos modificados
2. git diff HEAD       → revisar cada mudança linha a linha
3. Checklist de segurança:
   □ Nenhum secret exposto
   □ Soft-delete preservado
   □ AuditLog presente em toda operação write
   □ Oracle guard intacto
   □ Tipos Decimal preservados em valores financeiros
   □ Testes passando
4. Emitir relatório: APROVADO / BLOQUEADO (com justificativa)
```

**Gatilhos de bloqueio automático:**
- Secret key em qualquer arquivo fora de `.env*`.
- Teste falhando sem justificativa documentada.
- Migration sem `prisma migrate status` executado e reportado.
- Remoção de qualquer entrada em `SECURITY.md` sem aprovação do Orchestrator.

---

### 4.5 Agent `conselheiro-0` (Orchestrator Master)
**Role:** Orchestrator Master, Conselheiro Estratégico & Auditor Sênior de Software

**Responsabilidade:**
- Análise de alto nível, checagem e auditoria direta de toda a base de código e da lógica de negócios.
- Formulação e construção de instruções técnicas rigorosas, ordens de serviço (OS) e diretrizes arquiteturais para o Squad de Agentes.
- Apoio direto e aconselhamento de negócios e técnico a Dom Gustavo Lago (Tech Lead).
- Gestão e supervisão de conformidade de segurança, proteção de banco de dados e fluxos Web3.

**Escopo autorizado:**
- Acesso de leitura e análise a todo o projeto e pasta raiz.
- Escrita e modificação restritas aos arquivos de governança, documentação, especificações, logs e arquivos sob a pasta `.agents/` ou diretórios de planejamento/artefatos da IA.

**Restrições e Proibições Estritas (NUNCA VIOLAR):**
- **PROIBIDO ALTERAR QUALQUER LINHA DE CÓDIGO-FONTE DA APLICAÇÃO.** Qualquer modificação em arquivos de código-fonte (.ts, .tsx, .rs, .prisma, .css, etc. fora do escopo de documentação/governança/artefatos) é estritamente proibida para o Conselheiro 0.
- O Conselheiro 0 deve utilizar todas as suas demais habilidades cognitivas avançadas e acessos de leitura para analisar o código, mas a modificação e a codificação das regras/correções devem ser inteiramente delegadas ao Squad de Agentes Executores (`backend-engineer`, `web3-engineer`, `frontend-engineer`, `devsecops-qa`).

---

## 5. Escalonamento e Autoridade

| Situação | Ação |
|---|---|
| Agente detecta risco de segurança crítico | Parar imediatamente, alertar Orchestrator, aguardar |
| Conflito entre agentes sobre arquitetura | Orchestrator decide — baseado em dados, não em opinião |
| Mudança no smart contract program ID | Aprovação explícita do Tech Lead obrigatória |
| Deploy em mainnet | Fora do escopo dos agentes — requer processo humano completo |
| Mudança em `prisma/schema.prisma` | Sempre com migration explícita, nunca `prisma db push` em produção |

---

## 6. Estado Atual do Repositório (Auditado em 2026-05-30)

### Stack Técnica Confirmada
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16.0.10 + React 19.2.3 + Tailwind 3 + Radix UI + Framer Motion |
| Backend | Next.js API Routes (server-side) |
| Database | PostgreSQL via Supabase, ORM Prisma 6.10.1 |
| Blockchain | Solana (devnet), Anchor framework, @solana/kit |
| Storage | Arweave via Irys (@irys/upload-solana) |
| State | Zustand 5, SWR 2 |
| Oracle | Pyth + Jupiter v3 (dual-oracle guard, 3% threshold) |
| Auth | Wallet-based (Phantom etc.) via @solana/wallet-adapter |

### Gaps de Segurança Conhecidos (SECURITY.md §5)
Estes itens são **tarefas abertas** e os agentes relevantes devem priorizá-los:

1. **[backend-engineer]** Faucet quota em memória → migrar para `prisma.FaucetClaim` ou Redis.
2. **[backend-engineer]** Dual-write `User.credits` + `user_credits` → consolidar em transaction atômica.
3. **[web3-engineer]** Vault program sem audit formal → nenhuma expansão de surface sem review.
4. **[devsecops-qa]** SCA automatizado (Snyk/Dependabot) não configurado → adicionar ao CI.
5. **[backend-engineer]** Rate limiting ad-hoc → centralizar em middleware Next.js.
6. **[backend-engineer]** CSRF/origin allowlist para endpoints `/api/credits/` e `/api/admin/`.
7. **[backend-engineer]** Webhook signature verification antes de mainnet.

---

## 7. Glossário Técnico do Projeto

| Termo | Definição |
|---|---|
| TKZ | Token de crédito interno da plataforma Lake (não é o SPL token do RWA) |
| RWA | Real World Asset — ativo do mundo real tokenizado on-chain |
| Soft-delete | `isDeleted = true` + `deletedAt` — nunca DELETE físico |
| Vault Program | Programa Anchor em `anchor/programs/vault` (PDA por carteira) |
| Treasury | Carteira da plataforma que assina uploads Irys e o faucet devnet |
| Oracle Guard | Comparação Pyth vs. Jupiter, rejeita trade se divergência > 3% |
| child_fraction_hash | Hash único por fração de investimento no `InvestmentReceipt` — imutável |
| AssetStatus | DRAFT → PENDING_REVIEW → APPROVED → TOKENIZED (ou REJECTED) |

---

*Este documento é mantido pelo Orchestrator (Conselheiro Estratégico 0) e revisado a cada sprint ou sempre que houver mudança arquitetural significativa.*
