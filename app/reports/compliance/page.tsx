import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ComplianceReportPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl p-10 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-8">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Relatório Executivo de Infraestrutura: Compliance e Tokenização P2P</h1>
            <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold">LakeTokeniza | Auditoria Regulatória (CVM)</p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-blue-500 pl-4">1. Introdução e Propósito Regulatório</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>O presente relatório detalha as mais recentes implementações de arquitetura na plataforma LakeTokeniza. O objetivo primário deste ciclo de engenharia foi garantir que a plataforma atue estritamente como <strong>provedora de infraestrutura tecnológica (SaaS Web3)</strong>, eliminando o risco de ser enquadrada inadvertidamente como custodiante financeira, câmara de compensação (clearing) ou corretora de valores centralizada.</p>
              <p>As atualizações garantem alinhamento com as diretrizes de mercado de capitais e sandbox regulatório da CVM, com ênfase na proteção ao investidor, transparência (marcação a mercado) e trilhas de auditoria imutáveis.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-blue-500 pl-4">2. Arquitetura Não-Custodial e Roteamento Financeiro Atômico</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Para evitar o passivo de custódia e a bitributação, a lógica de liquidação financeira foi reestruturada para operar 100% de ponta-a-ponta (Peer-to-Peer).</p>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">2.1. Split Payment Atômico na Solana (Triple Split)</h3>
                <p className="mb-3">O contrato inteligente (e as transações submetidas ao cluster Solana) agora executa a fragmentação instantânea do capital no momento da compra:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-slate-100">Principal (Capital Investido):</strong> Transferido <em>diretamente</em> da carteira do investidor para a carteira do Criador/Emissor do Ativo. A LakeTokeniza <strong>não toca no capital principal</strong>.</li>
                  <li><strong className="text-slate-100">Taxa Operacional:</strong> Uma instrução paralela na mesma transação transfere a taxa da plataforma (ex: US$ 1.00 convertido em SOL) diretamente para a Treasury Wallet.</li>
                  <li><strong className="text-slate-100">Mitigação Legal:</strong> Ao não realizar o trânsito do dinheiro dos investidores em contas da plataforma, evitamos a necessidade de licenças de Instituição de Pagamento (IP) ou custódia pelo Banco Central.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-blue-500 pl-4">3. Conformidade no Mercado Primário (Emissão e Governança)</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>O Mercado Primário é a base onde os emissores captam recursos. Implementamos mecanismos de controle de risco cruciais para ofertas públicas ou privadas (sob as instruções aplicáveis da CVM, ex: RCVM 88).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-200 mb-3">3.1. Circuit Breaker do Emissor</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-slate-100">Implementação:</strong> Foi introduzido o status dinâmico na base de dados relacional, refletido em tempo real.</li>
                    <li><strong className="text-slate-100">Governança:</strong> O Emissor do ativo pode acionar a função <strong>"Pausar Vendas"</strong>, removendo a oferta imediatamente da vitrine pública.</li>
                    <li><strong className="text-slate-100">Uso Regulatório:</strong> Permite interromper a captação imediatamente caso atinja limites legais ou fatos relevantes.</li>
                  </ul>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-200 mb-3">3.2. Ciclo de Vida e Auditoria</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-slate-100">Fluxo de Aprovação:</strong> Ativos exigem publicação explícita.</li>
                    <li><strong className="text-slate-100">Auditoria Arweave:</strong> Imagens e documentos salvos no Arweave via Irys, garantindo lâminas de oferta e contratos imutáveis.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-blue-500 pl-4">4. Otimização do Mercado Secundário e Proteção ao Investidor</h2>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <p>A permissão de negociação secundária exige sistemas que evitem manipulação e garantam a propriedade real do ativo.</p>
              
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">4.1. Fissão de Recibos (Liquidez Fracionada)</h3>
                <p className="mb-2">Quando um investidor decide vender parte do seu portfólio, o sistema realiza a "Fissão" do recibo original.</p>
                <p><strong>Mecânica de Lastro:</strong> A fração vendida gera um novo hash SHA-256 derivado da assinatura original na Solana. Isso cria uma "árvore genealógica" do recibo, provando matematicamente que o token secundário deriva legitimamente do ativo primário.</p>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3">4.2. Controle de Ordem e Marcação a Mercado</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-slate-100">Cancelamento P2P:</strong> Retirada de ofertas instantaneamente protegendo o usuário de execuções indesejadas.</li>
                  <li><strong className="text-slate-100">Marcação a Mercado:</strong> Inteligência analítica em tempo real comparando Custo Histórico contra Cotação Atual (USD/BRL), atendendo ao princípio de transparência de risco (FX Risk vs Asset Risk).</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-100 mb-4 border-l-4 border-blue-500 pl-4">5. Conclusão</h2>
            <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-800/30 text-blue-100 leading-relaxed">
              A arquitetura atual da <strong>LakeTokeniza</strong> provê um "Ledger Interface" sofisticado que conecta emissores e investidores através de smart contracts da Solana e bancos relacionais rigorosos, operando sob o modelo estrito de tecnologia (SaaS). O controle de liquidez, os circuit breakers, a marcação a mercado e o split payment não-custodial compõem uma tese técnica sólida e auditável para eventuais due diligences ou aprovações pela CVM no contexto de ativos tokenizados.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
