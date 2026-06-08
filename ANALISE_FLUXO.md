# Análise de Fluxo de Negócio – Lake (Opening digital horizons)

## Visão Geral

A **Lake** é uma plataforma inovadora focada na tokenização de Ativos do Mundo Real (RWA) atuando com tecnologia Web3 na blockchain Solana. A plataforma atua em dupla via:
1. **Para Criadores:** Permite transformar negócios, propriedades, e ativos físicos em tokens SPL rastreáveis de forma simples e desburocratizada, usando a Solana para transações e o Arweave (via Irys) para persistência permanente de documentos.
2. **Para Investidores:** Oferece um marketplace para aquisição fracionada de ativos validados, com simulações de retorno, dividendos e acompanhamento seguro.

## Fluxo de Arquitetura e Dados

O fluxo central segue um conceito de esteira "Web2.5", oferecendo a familiaridade do mercado tradicional com a infraestrutura imutável das blockchains:

1. **Ingestão e Validação (Tokenização):**
   - O criador descreve o ativo, define métricas financeiras (Valuation, Total de Tokens, Retenção da Tesouraria).
   - Este processo requer **Créditos Lake**, que funcionam como barreira anti-spam e mecanismo de monetização da plataforma.
   - O contrato/tese é enviado ao **Arweave** (via Irys) para registro perpétuo e descentralizado. O custo é pago pela carteira "Treasury" gerenciada no backend, evitando que o criador pague gas rates altas de armazenamento.
   - Os dados indexados (incluindo a URL da imagem/comprovante do Arweave) são salvos em um banco de dados relacional **PostgreSQL via Supabase (Prisma ORM)**.

2. **Gerenciamento e Governança:**
   - O criador possui um **Dashboard** que exibe o valuation dinâmico e o preço por token em tempo real (`CurrencyDisplay`).
   - Ele pode **editar** a descrição do negócio ("A Missão e o Lastro"), mantendo o controle do "pitch" de vendas de forma dinâmica, cujas alterações são persistidas imediatamente no backend (`PATCH /api/assets/[id]`).

3. **Oferta e Negociação (Marketplace):**
   - Os ativos aprovados vão para o Marketplace. 
   - Apenas usuários logados via carteira Web3 (ex: Phantom) têm acesso à tese completa de investimento, criando exclusividade e um funil orgânico de usuários qualificados.
   - O **Modal de Investimento** está integrado diretamente com os parâmetros do banco de dados (tokens emitidos, descrição real, cálculo de valuation BRL/USD/SOL) e conta com travas robustas de interface para que o investidor não possa selecionar uma quantia de frações maior do que o **Inventário Disponível (`tokensAvailable`)**.

## Sentido Lógico e Evolução do Produto

O que construímos não é apenas uma UI bonitinha; é um **motor econômico com lastro de segurança**:
- A implementação recente de travas de segurança (verificar auth web3 antes de investir) garante que apenas agentes rastreáveis interajam com o core financeiro.
- O mapeamento preciso dos limites (inventário bloqueando inputs de mais tokens) impede cenários caóticos de overbooking no front-end.
- A clareza dos custos e valuations reais nas interfaces eleva a credibilidade institucional perante o investidor final.

Em essência, a Lake atua como uma **Bolsa de Valores Descentralizada** para PMEs e Empreendimentos, onde o risco de plataforma é minimizado pela clareza dos dados e o registro perpétuo no Arweave.
