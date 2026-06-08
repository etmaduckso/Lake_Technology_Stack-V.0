import React from 'react';
import { Lock } from 'lucide-react';

export default function TechnicalAuditPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl p-10 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-8">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Relatório Executivo de Auditoria Técnica</h1>
            <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold">LakeTokeniza | Segurança, Integridade de Dados e Garantia Operacional</p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">1. Escopo da Auditoria</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Este relatório comprova a robustez arquitetural e as decisões de engenharia da plataforma <strong>LakeTokeniza</strong>. O documento atesta que a infraestrutura, a lógica de negócio e as escolhas tecnológicas não apenas suportam a escalabilidade da tokenização de ativos do mundo real (RWA), mas também estabelecem um padrão "State-of-the-Art" em segurança de dados e proteção financeira para todos os atores envolvidos (Emissores, Investidores e Plataforma).</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">2. Fundação Tecnológica e Type-Safety</h2>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <p>A plataforma foi construída sobre uma base estritamente tipada e de alta performance, projetada para mitigar riscos de runtime e injeção de dados anômalos.</p>
              
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">2.1. Prisma ORM & Validação de Schema Relacional</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>O banco de dados opera sob o <strong>Prisma ORM</strong>, garantindo integridade referencial absoluta (Foreign Keys).</li>
                  <li><strong>Prevenção contra SQL Injection e Corrupção de Dados:</strong> Valores nulos não-intencionais e conversões cambiais incorretas (ex: floats quebrados) são blindados na camada do banco.</li>
                  <li><strong>Type-Safety End-to-End:</strong> Todo o código TypeScript passa pela compilação restrita (Exit Code 0), garantindo que payloads de API coincidam perfeitamente com a UI.</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">2.2. Next.js App Router (Server-Side Security)</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>React Server Components (RSC):</strong> O cálculo de valorações (Marcação a Mercado) ocorre no lado do servidor, impedindo que a lógica de precificação seja exposta ou manipulada no navegador (Client-side tampering).</li>
                  <li>A invalidação de rotas dinâmicas garante que não ocorram problemas de "estado fantasma" onde usuários veriam saldos obsoletos.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">3. Segurança de Transações Financeiras (Blockchain Solana)</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>A segurança do fluxo financeiro é garantida matematicamente através da rede Solana, eliminando riscos de intercepção (Man-In-The-Middle) na liquidação.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-200 mb-3">3.1. Transações Atômicas</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-slate-100">Logica Segura:</strong> A liquidação P2P é empacotada em uma única transação web3.</li>
                    <li><strong className="text-slate-100">Garantia de Execução:</strong> O modelo da Solana garante Atomicidade. Ou o capital chega ao Emissor E a Taxa chega à Tesouraria, ou a transação falha inteiramente (Revert).</li>
                  </ul>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-200 mb-3">3.2. Prova de Execução</h3>
                  <p>O backend exige a assinatura criptográfica da Solana e só emite o Recibo se a blockchain reconhecer a transação como válida e irreversível (Finality).</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">4. Imutabilidade Documental e Auditoria</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">4.1. Rede Arweave (Armazenamento Perpétuo)</h3>
                <p>Toda a documentação e comprovantes são hospedados na blockchain de armazenamento Arweave (via Irys Network). Ao contrário de um bucket AWS S3 que pode ser editado pelo admin, o Arweave impossibilita a adulteração retroativa do documento que lastreia o token.</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">4.2. Fissão de Hashes SHA-256 no Secundário</h3>
                <p>O ciclo de revenda gera sub-hashes atreladas (Filhos) ao Hash Pai da transação original, garantindo Rastreabilidade Completa. Nenhum token pode surgir "do nada".</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">5. Controle de Acesso e Governança</h2>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-slate-300 leading-relaxed">
              <ul className="list-disc pl-5 space-y-4">
                <li><strong className="text-slate-100">Wallet-Based Authentication:</strong> Todas as ações modificadoras de estado (ex: Deletar Ativo, Pausar Vendas, Cancelar Ordem) validam obrigatoriamente a assinatura ou identidade da carteira no lado do servidor. Requisições forjadas via CURL/Postman são barradas com Erro HTTP 403 (Forbidden).</li>
                <li><strong className="text-slate-100">Circuit Breaker Restrito:</strong> Apenas emissores autenticados possuem permissão para acionar a retirada do ativo do mercado, impedindo ataques de negação de serviço (DDoS) ou sabotagem.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-emerald-500 pl-4">Conclusão de Auditoria</h2>
            <div className="bg-emerald-900/20 p-6 rounded-xl border border-emerald-800/30 text-emerald-100 leading-relaxed">
              As lógicas de negócios e as tecnologias aplicadas atestam o grau institucional da <strong>LakeTokeniza</strong>. O uso coordenado de Atomicidade via Solana, Imutabilidade via Arweave e Type-Safety via Next.js formam uma "Fortaleza Criptográfica" que protege o capital e a documentação dos usuários contra fraudes externas e vulnerabilidades internas. O software atende integralmente os requisitos de escalabilidade e segurança de uma infraestrutura financeira Tier 1.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
