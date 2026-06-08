import Link from "next/link";
import { ShieldCheck, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-8 mt-auto border-t border-slate-200 flex flex-col items-center justify-center bg-transparent">
      <div className="flex items-center justify-center space-x-6">
        <Link 
          href="/reports/compliance" 
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 font-medium"
        >
          <FileText className="w-3.5 h-3.5" />
          Compliance e Risco Regulatório (CVM)
        </Link>
        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
        <Link 
          href="/reports/audit" 
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Auditoria Técnica e Segurança
        </Link>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest">
        © {new Date().getFullYear()} LakeTokeniza. Todos os direitos reservados.
      </p>
    </footer>
  );
}
