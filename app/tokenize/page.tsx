"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowRight,
  Loader2, Zap, Lock, ImageIcon, X, Save,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useCredits } from "@/context/credits-context";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useMedals } from "@/context/medals-context";
import { useTokenizeDraft } from "@/hooks/useTokenizeDraft";
import {
  saveDraft,
  type DraftMeta,
} from "@/lib/storage/draft-store";

// ─── Constantes ───────────────────────────────────────────────────────────────
const SECTOR_OPTIONS = [
  "Imóvel (Real Estate)", "Energia Renovável", "Agronegócio (Agro)",
  "Dívida / Precatórios", "Startups / Equity", "Créditos de Carbono",
  "Royalties Musicais", "Outros",
];
const NATURE_OPTIONS = [
  "Ativo de Renda/Security", "Token de Utilidade/Acesso", "NFT/Colecionável",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseCurrency = (value: string) => Number(value.replace(/\D/g, "")) / 100;
const formatInputValue = (val: number) =>
  val ? val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

/**
 * Comprime a imagem para no máximo 800px e retorna o Blob resultante.
 * O Blob é enviado direto ao IndexedDB (sem passar por Base64).
 */
async function compressImageToBlob(file: File): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve({ blob, mimeType });
          else reject(new Error("Falha ao converter imagem para Blob."));
        },
        mimeType,
        0.82,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Falha ao carregar imagem.")); };
    img.src = url;
  });
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function TokenizePage() {
  const router = useRouter();
  const { walletAddress, connectWallet, isConnected } = useWallet();
  const { credits, spendCredit, openModal, isLoading: isCreditLoading } = useCredits();
  const { isEarned } = useMedals();
  const { draft, setDraft, isLoaded } = useTokenizeDraft();

  const ja_tem_medalha_fase5 = isEarned("fase-5-tokenizador");

  // ─── UI State ─────────────────────────────────────────────────────────────
  const [hasAccess, setHasAccess] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Arquivos locais (File objects — vivem apenas nesta sessão) ───────────
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // ─── Form sincronizado com draft localStorage (apenas texto/números) ──────
  const formData = {
    name: draft.name, sector: draft.sector, tokenNature: draft.tokenNature,
    description: draft.description, valuation: draft.valuation,
    tokenCount: draft.tokenCount, tokenPrice: draft.tokenPrice,
    treasuryTokens: draft.treasuryTokens, royalties: draft.royalties,
  };
  const setFormData = (updates: Partial<typeof formData>) =>
    setDraft((prev) => ({ ...prev, ...updates }));

  // Persiste step
  useEffect(() => { if (isLoaded) setDraft((p) => ({ ...p, currentStep: step })); }, [step, isLoaded]);

  // Preview da imagem (Object URL — local)
  useEffect(() => {
    if (!coverImageFile) { setCoverImagePreview(null); return; }
    const url = URL.createObjectURL(coverImageFile);
    setCoverImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverImageFile]);

  // Cálculos financeiros
  const totalRaise = formData.tokenCount * formData.tokenPrice;
  const projectedProfit = totalRaise - formData.valuation;
  const profitMargin = formData.valuation > 0 ? (projectedProfit / formData.valuation) * 100 : 0;

  // ─── Ações ────────────────────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (credits <= 0) { openModal(); return; }
    if (await spendCredit()) setHasAccess(true);
  };

  const handleNext = () => {
    setErrors(null);
    if (step === 1 && (!formData.name || !formData.sector || !formData.tokenNature || !formData.description)) {
      setErrors("Todos os campos do Passo 1 são obrigatórios."); return;
    }
    if (step === 2 && (!formData.valuation || !formData.tokenCount || !formData.tokenPrice)) {
      setErrors("Defina os valores financeiros principais."); return;
    }
    if (step === 2 && formData.treasuryTokens > formData.tokenCount) {
      setErrors("Tokens retidos não podem ser maiores do que a quantidade total."); return;
    }
    setStep((p) => p + 1);
  };

  /**
   * Salva o rascunho de forma híbrida:
   *  - metadados (texto/números) → localStorage via DraftMeta
   *  - imagem comprimida         → IndexedDB via Blob
   *  - PDF (se houver)           → IndexedDB via Blob
   */
  const handleSaveDraft = async () => {
    if (!coverImageFile) { setErrors("A imagem de capa é obrigatória."); return; }
    if (!walletAddress) { setErrors("Conecte sua carteira antes de salvar."); return; }

    setErrors(null);
    setIsSaving(true);

    try {
      // Comprime para Blob (não Base64 — evita limite localStorage)
      const { blob: imageBlob, mimeType } = await compressImageToBlob(coverImageFile);

      const meta: DraftMeta = {
        name: formData.name,
        sector: formData.sector,
        tokenNature: formData.tokenNature,
        description: formData.description,
        valuation: formData.valuation,
        tokenCount: formData.tokenCount,
        tokenPrice: formData.tokenPrice,
        treasuryTokens: formData.treasuryTokens,
        royalties: formData.royalties,
        coverImageName: coverImageFile.name,
        coverImageMimeType: mimeType,
        pdfFileName: pdfFile?.name,
        savedAt: new Date().toISOString(),
      };

      // Persiste: meta → localStorage, blobs → IndexedDB
      await saveDraft(meta, imageBlob, pdfFile ?? null);

      // Limpa o estado temporário do formulário do wizard
      localStorage.removeItem("lake_tokenize_draft_v1");

      router.push("/dashboard/manage/draft");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors(`Falha ao salvar rascunho: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Tela de acesso bloqueado ─────────────────────────────────────────────
  if (!hasAccess) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-200">
        <Lock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Simulador Institucional</h1>
        <p className="text-slate-500 mb-6">Acesso restrito. Tokenize ativos reais.</p>
        {!isConnected ? (
          <button onClick={connectWallet} className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold">
            Conectar Carteira
          </button>
        ) : (
          <button onClick={handleUnlock} disabled={isCreditLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex justify-center gap-2">
            {isCreditLoading ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
            {credits > 0 ? "Desbloquear (3 Créditos)" : "Comprar Acesso"}
          </button>
        )}
      </div>
    </div>
  );

  // ─── Wizard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-12 flex justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10 max-w-4xl w-full h-fit">

        {/* Barra de progresso */}
        <div className="flex justify-between mb-10 px-10">
          {[1, 2, 3].map((s) => (
            <div key={s}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= s ? "bg-slate-900 text-white shadow-md scale-110" : "bg-slate-100 text-slate-400"}`}>
              {s}
            </div>
          ))}
        </div>

        {/* Erros */}
        {errors && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">{errors}</span>
          </div>
        )}

        {/* Banner medalha */}
        {ja_tem_medalha_fase5 && (
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-sm"><strong>Você já possui a medalha desta fase!</strong> Sinta-se livre para simular novos ativos.</span>
          </div>
        )}

        {/* ── PASSO 1: Dados ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-3xl font-bold text-slate-800">Dados do Ativo</h2>
            <div>
              <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Nome</label>
              <input type="text"
                className="w-full p-4 text-lg border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Fazenda Santa Fé" value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Setor</label>
                <select className="w-full p-4 text-lg border rounded-xl bg-slate-50 focus:bg-white outline-none"
                  value={formData.sector} onChange={(e) => setFormData({ sector: e.target.value })}>
                  <option value="">Selecione o Setor...</option>
                  {SECTOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Natureza do Token</label>
                <select className="w-full p-4 text-lg border rounded-xl bg-slate-50 focus:bg-white outline-none"
                  value={formData.tokenNature} onChange={(e) => setFormData({ tokenNature: e.target.value })}>
                  <option value="">Selecione a Natureza...</option>
                  {NATURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
              <textarea rows={4}
                className="w-full p-4 text-lg border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Detalhes..." value={formData.description}
                onChange={(e) => setFormData({ description: e.target.value })} />
            </div>
          </div>
        )}

        {/* ── PASSO 2: Financeiro ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-3xl font-bold text-slate-800">Estrutura Financeira e Tesouraria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Valuation (Custo Base)</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">R$</span>
                  <input type="text"
                    className="w-full p-4 pl-14 text-xl font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formatInputValue(formData.valuation)}
                    onChange={(e) => setFormData({ valuation: parseCurrency(e.target.value) })} />
                </div>
                <div className="mt-1 pl-2"><CurrencyDisplay variant="subtextOnly" brlValue={formData.valuation} /></div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Preço Venda (por token)</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-blue-400 font-bold text-lg">R$</span>
                  <input type="text"
                    className="w-full p-4 pl-14 text-xl font-bold border-2 border-blue-100 rounded-xl bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formatInputValue(formData.tokenPrice)}
                    onChange={(e) => setFormData({ tokenPrice: parseCurrency(e.target.value) })} />
                </div>
                <div className="mt-1 pl-2"><CurrencyDisplay variant="subtextOnly" brlValue={formData.tokenPrice} /></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Qtd. Tokens</label>
                <input type="number"
                  className="w-full p-4 text-lg font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  value={formData.tokenCount || ""}
                  onChange={(e) => setFormData({ tokenCount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Tokens Retidos (Tesouraria)</label>
                <input type="number"
                  className="w-full p-4 text-lg font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  value={formData.treasuryTokens || ""}
                  onChange={(e) => setFormData({ treasuryTokens: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Tokens para o Mercado</label>
                <div className="w-full p-4 text-lg font-bold border border-slate-200 rounded-xl bg-slate-100 text-slate-600 select-none cursor-not-allowed">
                  {Math.max(0, formData.tokenCount - formData.treasuryTokens).toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-500 uppercase mb-1 block">Royalties de Revenda (%)</label>
              <div className="relative">
                <input type="number" step="0.1" min="0" max="15"
                  className="w-full p-4 pr-12 text-lg font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: 2.5" value={formData.royalties || ""}
                  onChange={(e) => setFormData({ royalties: parseFloat(e.target.value) || 0 })} />
                <span className="absolute right-4 top-4 text-slate-400 font-bold text-lg">%</span>
              </div>
            </div>
            <div className={`border-l-4 p-6 rounded-r-xl flex justify-between items-center shadow-sm ${projectedProfit >= 0 ? "bg-emerald-50 border-emerald-500" : "bg-red-50 border-red-500"}`}>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${projectedProfit >= 0 ? "text-emerald-800" : "text-red-800"}`}>Lucro Estimado</p>
                <CurrencyDisplay variant="success" brlValue={projectedProfit} />
              </div>
              <span className={`bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm border ${projectedProfit >= 0 ? "text-emerald-700 border-emerald-100" : "text-red-700 border-red-100"}`}>
                {profitMargin > 0 ? "+" : ""}{profitMargin.toFixed(1)}% Markup
              </span>
            </div>
          </div>
        )}

        {/* ── PASSO 3: Documentação ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Documentação Oficial do Ativo</h2>
              <p className="text-slate-500 mt-2 text-sm">
                Selecione os documentos comprobatórios e a imagem de capa. Os arquivos de mídia e relatórios serão processados localmente de forma segura e criptografada.
                A autorização e o registro oficial de emissão serão confirmados no painel de controle.
              </p>
            </div>

            {/* Imagem de Capa (obrigatória) */}
            <div>
              <label className="text-sm font-bold text-slate-500 uppercase mb-2 block">
                Imagem de Capa <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-slate-400 normal-case font-normal">(Obrigatória)</span>
              </label>
              {coverImageFile ? (
                <div className="border-2 border-emerald-200 rounded-2xl p-5 bg-emerald-50 flex items-center gap-4">
                  {coverImagePreview && (
                    <img src={coverImagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-emerald-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{coverImageFile.name}</p>
                    <p className="text-sm text-emerald-600 mt-1">{(coverImageFile.size / 1024).toFixed(1)} KB • otimizada para arquivamento</p>
                  </div>
                  <button onClick={() => setCoverImageFile(null)} className="p-2 rounded-full hover:bg-emerald-100 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center flex flex-col items-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group">
                  <input type="file" className="hidden" accept="image/*"
                    onChange={(e) => e.target.files && setCoverImageFile(e.target.files[0])} />
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                    <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <p className="font-bold text-slate-700">Clique para selecionar a imagem de capa</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG, WEBP (qualquer tamanho — será processada localmente)</p>
                </label>
              )}
            </div>

            {/* PDF do Contrato (opcional) */}
            <div>
              <label className="text-sm font-bold text-slate-500 uppercase mb-2 block">
                PDF do Contrato / Matrícula
                <span className="ml-2 text-xs text-slate-400 normal-case font-normal">(Opcional)</span>
              </label>
              {pdfFile ? (
                <div className="border-2 border-blue-100 rounded-2xl p-5 bg-blue-50 flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{pdfFile.name}</p>
                    <p className="text-sm text-blue-600 mt-1">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setPdfFile(null)} className="p-2 rounded-full hover:bg-blue-100 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-all group">
                  <input type="file" className="hidden" accept="application/pdf"
                    onChange={(e) => e.target.files && setPdfFile(e.target.files[0])} />
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <p className="font-bold text-slate-600">Clique para anexar o PDF (opcional)</p>
                  <p className="text-sm text-slate-400 mt-1">PDF (qualquer tamanho)</p>
                </label>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm text-indigo-800">
              <p className="font-bold mb-1">Conformidade e Armazenamento Local Seguro</p>
              <p>Os arquivos e relatórios regulatórios de auditoria permanecem salvos localmente com segurança no seu navegador. A sincronização perpétua com a rede de registros ocorrerá após aprovação e autorização final.</p>
            </div>
          </div>
        )}

        {/* ── Navegação ─────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-12 pt-6 border-t border-slate-100">
          <button onClick={() => setStep((p) => p - 1)} disabled={step === 1 || isSaving}
            className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl disabled:opacity-50 text-lg transition-all">
            Voltar
          </button>

          {step < 3 ? (
            <button onClick={handleNext}
              className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-900 shadow-xl flex items-center gap-3 text-lg">
              Próximo <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSaveDraft} disabled={isSaving || !coverImageFile}
              className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl flex items-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-6 h-6" /> Salvar Rascunho</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}