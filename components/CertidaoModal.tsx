import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { X, Lock, ShieldCheck, Stamp, Award, Fingerprint } from 'lucide-react';

interface CertidaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerWallet: string;
  certidaoId: string;
}

export function CertidaoModal({
  isOpen,
  onClose,
  ownerWallet,
  certidaoId,
}: CertidaoModalProps) {
  const { publicKey } = useWallet();
  const [validOwner, setValidOwner] = useState(false);

  // ✓ Listener: Fechar modal se wallet mudar ou não for a dona legítima
  useEffect(() => {
    if (isOpen && publicKey?.toBase58() !== ownerWallet) {
      console.warn('Wallet mudou. Fechando modal por segurança.');
      onClose();
      setValidOwner(false);
      return;
    }

    if (isOpen && publicKey?.toBase58() === ownerWallet) {
      setValidOwner(true);
    }
  }, [publicKey, ownerWallet, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-gradient-to-b from-[#0a0f1d] to-[#040814] border border-amber-500/25 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!validOwner ? (
          /* Acesso Negado */
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-bounce">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
            <p className="text-sm text-slate-400 max-w-xs">
              Você não tem permissão para visualizar esta certidão com a carteira conectada atualmente.
            </p>
          </div>
        ) : (
          /* Certidão Autêntica */
          <div className="space-y-6">
            {/* Header com carimbo dourado */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Stamp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-widest uppercase">Certidão de Registro</h2>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{certidaoId}</p>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                    Assinatura Sol
                  </span>
                  <span className="font-mono text-slate-200 truncate max-w-[150px]" title={ownerWallet}>
                    {ownerWallet.slice(0, 8)}...{ownerWallet.slice(-8)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    Status do Visto
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    Verificado
                  </span>
                </div>
              </div>

              {/* Selo de Fé Pública */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                <p className="text-[11px] leading-relaxed text-amber-300 font-medium">
                  Este documento digital atesta on-chain a autenticidade e imutabilidade dos metadados de visitante sob os padrões criptográficos do Ecossistema Lake.
                </p>
              </div>
            </div>

            {/* Footer */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-sm transition shadow-lg shadow-amber-500/10"
            >
              Fechar Certidão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
