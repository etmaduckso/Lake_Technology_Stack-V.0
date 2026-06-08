"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/wallet-context";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/use-toast";
import { getAdmins, upsertAdmin, revokeAdmin } from "@/app/actions/admin.actions";
import { 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Search, 
  RefreshCw, 
  Download, 
  ChevronRight, 
  ArrowUpRight, 
  Database
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";

type ActionType = 
  | "ARTICLE_UPDATE" 
  | "USER_UPGRADE" 
  | "ASSET_APPROVED" 
  | "COMMENT_DELETE" 
  | "PARAM_CHANGE" 
  | "SMART_CONTRACT_UPGRADE";

interface AuditLog {
  id: string;
  actor: string;
  actionType: ActionType;
  target: string;
  timestamp: string;
}

const AUDIT_LOGS: AuditLog[] = [
  {
    id: "1",
    actor: "0xAdmin...4f7a",
    actionType: "ARTICLE_UPDATE",
    target: "Fundamentos RWA",
    timestamp: "24 Maio 2026",
  },
  {
    id: "2",
    actor: "0xSuper...12bc",
    actionType: "USER_UPGRADE",
    target: "Carteira 0x71a... (VIP Nível 3)",
    timestamp: "23 Maio 2026",
  },
  {
    id: "3",
    actor: "0xAdmin...4f7a",
    actionType: "ASSET_APPROVED",
    target: "Fazenda Solar RWA - Lote A",
    timestamp: "22 Maio 2026",
  },
  {
    id: "4",
    actor: "0xModer...88ea",
    actionType: "COMMENT_DELETE",
    target: "Spam no Artigo 2 (Segurança Jurídica)",
    timestamp: "21 Maio 2026",
  },
  {
    id: "5",
    actor: "0xAdmin...4f7a",
    actionType: "PARAM_CHANGE",
    target: "Taxa de Listagem: Ajustada para 5 créditos",
    timestamp: "20 Maio 2026",
  },
  {
    id: "6",
    actor: "0xSuper...12bc",
    actionType: "SMART_CONTRACT_UPGRADE",
    target: "Vault Principal de Distribuição V2",
    timestamp: "19 Maio 2026",
  },
  {
    id: "7",
    actor: "0xAdmin...4f7a",
    actionType: "ARTICLE_UPDATE",
    target: "Segurança Jurídica na Tokenização",
    timestamp: "18 Maio 2026",
  },
  {
    id: "8",
    actor: "0xModer...88ea",
    actionType: "USER_UPGRADE",
    target: "Carteira 0x39a... (VIP Nível 1)",
    timestamp: "17 Maio 2026",
  }
];

export default function MasterAdminPage() {
  const { walletAddress } = useWallet();
  const { isAdmin, isMaster, publicKey, connected } = useAdmin();
  const router = useRouter();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);

  const [activeAdmins, setActiveAdmins] = useState<{ id: string; walletAddress: string; role: string; grantedByMaster: string; createdAt: Date; updatedAt: Date; }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [adminForm, setAdminForm] = useState({ wallet: "", role: "Editor" });
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [logs] = useState<AuditLog[]>(AUDIT_LOGS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const result = await getAdmins();
    if (result.success && result.admins) {
      setActiveAdmins(result.admins);
    }
    setLoadingAdmins(false);
  };

  const handleConcederAdmin = async () => {
    if (!adminForm.wallet || !adminForm.role) return;
    setSubmitting(true);
    
    try {
      const res = await upsertAdmin(adminForm.wallet, adminForm.role, walletAddress!);
      if (res.success) {
        toast({
          title: "Acesso Concedido",
          description: `Cargo de ${adminForm.role} concedido com sucesso.`,
        });
        setAdminForm({ wallet: "", role: "Editor" });
        fetchAdmins();
      } else {
        toast({
          variant: "destructive",
          title: "Erro de Concessão",
          description: res.error || "Ocorreu um erro.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Erro Fatal",
        description: "Falha ao comunicar com o servidor.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevogarAdmin = async (targetWallet: string) => {
    try {
      const res = await revokeAdmin(targetWallet, walletAddress!);
      if (res.success) {
        toast({
          title: "Acesso Revogado",
          description: "Os privilégios da carteira foram removidos.",
        });
        fetchAdmins();
      } else {
        toast({
          variant: "destructive",
          title: "Erro de Revogação",
          description: res.error || "Não foi possível revogar o acesso.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Erro Fatal",
        description: "Falha ao comunicar com o servidor.",
      });
    }
  };

  useEffect(() => {
    if (isMaster) {
      fetchAdmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster]);

  // Removed from here

  useEffect(() => {
    // Permite que o auto-connect recupere a sessão antes de realizar o redirecionamento
    const timer = setTimeout(() => {
      setChecking(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checking) {
      if (!connected || !isAdmin) {
        setSearchTerm("");
        setFilterType("ALL");
        router.push("/");
      }
    }
  }, [checking, connected, isAdmin, publicKey, router]);

  useEffect(() => {
    setSearchTerm("");
    setFilterType("ALL");
  }, [publicKey]);

  const displayAdminWallet = walletAddress || "0xAdminMainAddressSolanaNetwork4f7a";

  // Desmontagem Forçada (Unmount) para evitar Flicker visual de dados do Admin
  if (!checking && (!connected || !isAdmin)) {
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin animate-spin-slow"></div>
          <p className="text-slate-400 text-xs font-mono">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const getActionBadge = (type: ActionType) => {
    switch (type) {
      case "ARTICLE_UPDATE":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">ARTICLE_UPDATE</Badge>;
      case "USER_UPGRADE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">USER_UPGRADE</Badge>;
      case "ASSET_APPROVED":
        return <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono text-[10px]">ASSET_APPROVED</Badge>;
      case "COMMENT_DELETE":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[10px]">COMMENT_DELETE</Badge>;
      case "PARAM_CHANGE":
        return <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px]">PARAM_CHANGE</Badge>;
      case "SMART_CONTRACT_UPGRADE":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px]">CONTRACT_UPGRADE</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono text-[10px]">{type}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "ALL" || log.actionType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      
      {/* Header do Painel Admin */}
      <div className="bg-slate-900 border-b border-slate-800 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[90px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-red-400">Master Admin Level</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Painel de Governança e Auditoria
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Console central de administração para monitoramento em tempo real de logs de auditoria, parametrização e concessão de privilégios VIP.
              </p>
            </div>
            
            {/* Wallet Master Admin */}
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-300 shadow-lg">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span>
                {displayAdminWallet.substring(0, 10)}...{displayAdminWallet.substring(displayAdminWallet.length - 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Métricas */}
      <div className="container mx-auto px-4 mt-12 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Card className="bg-slate-900/60 border-slate-800/80 shadow-md hover:border-slate-700 transition duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Embaixadores VIP</p>
                <p className="text-3xl font-extrabold text-white">1.248</p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +12% esta semana
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 shadow-md hover:border-slate-700 transition duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Ações Pendentes</p>
                <p className="text-3xl font-extrabold text-white">14</p>
                <p className="text-[10px] text-amber-400 font-semibold">
                  3 classificadas como críticas
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 shadow-md hover:border-slate-700 transition duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Volume RWA Tokenizado</p>
                <p className="text-3xl font-extrabold text-white">R$ 45,2M</p>
                <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  8.5% a.a. média
                </p>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Database className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 shadow-md hover:border-slate-700 transition duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Créditos LKT Distribuídos</p>
                <p className="text-3xl font-extrabold text-white">25.600</p>
                <p className="text-[10px] text-emerald-400 font-semibold">
                  +1.400 distribuídos hoje
                </p>
              </div>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
                <Coins className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Tabela de Audit Logs (Livro-Razão de Auditoria) */}
      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        <Card className="bg-slate-900/60 border-slate-800/80 shadow-xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/60 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-red-400" />
                  Livro-Razão de Auditoria (Audit Logs)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                  Registro criptográfico imutável de ações administrativas da plataforma.
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleRefresh}
                  variant="outline" 
                  className="bg-slate-800/50 hover:bg-slate-850 text-slate-300 border-slate-750 font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-slate-800/50 hover:bg-slate-850 text-slate-300 border-slate-750 font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Pesquisar por Carteira ou Alvo..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border-slate-800/80 pl-10 text-slate-300 placeholder-slate-500 focus-visible:ring-emerald-500/30 rounded-xl"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "ARTICLE_UPDATE", "USER_UPGRADE", "ASSET_APPROVED", "PARAM_CHANGE"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === type 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {type === "ALL" ? "Todos" : type}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Table>
              <TableHeader className="border-slate-800">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Carteira (Actor)</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ação (Action_Type)</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Alvo (Target)</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Data (Timestamp)</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                      Nenhum log encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-850 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-mono text-slate-300 py-4 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {log.actor}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {getActionBadge(log.actionType)}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-slate-200">
                        {log.target}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-slate-800 text-slate-400 hover:text-white px-2 h-8 rounded-lg"
                          title="Detalhar Transação"
                        >
                          <span className="text-[10px] font-bold mr-1">Detalhes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Gestão de Acessos (Área Restrita) - Apenas para Super Admin (Master) */}
      {isMaster && (
        <div className="container mx-auto px-4 mt-8 max-w-6xl">
          <Card className="bg-slate-900/60 border-red-500/20 hover:border-red-500/40 shadow-xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-indigo-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                Gestão de Acessos (Área Restrita)
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                Conceda ou revogue acesso administrativo para carteiras na plataforma LakeTokeniza.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Endereço da Carteira Solana
                  </label>
                  <Input 
                    placeholder="Cole a chave pública da carteira (ex: HHyZW...)" 
                    className="bg-slate-950 border-slate-800/80 text-slate-300 placeholder-slate-600 focus-visible:ring-red-500/30 rounded-xl h-10"
                    value={adminForm.wallet}
                    onChange={(e) => setAdminForm({ ...adminForm, wallet: e.target.value })}
                  />
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cargo (Role)
                  </label>
                  <div className="relative">
                    <select 
                      value={adminForm.role}
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                      className="w-full appearance-none bg-slate-950 border border-slate-800/80 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 rounded-xl px-3 py-2 text-sm h-10 cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Juridico">Jurídico</option>
                      <option value="Operador">Operador</option>
                      <option value="Suporte">Suporte</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    onClick={handleConcederAdmin}
                    disabled={submitting || !adminForm.wallet}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md w-full md:w-auto h-10 disabled:opacity-50"
                  >
                    {submitting ? "Processando..." : "Conceder/Atualizar Cargo"}
                  </Button>
                </div>
              </div>

              {/* Mesa de Governança - Administradores Ativos */}
              <div className="mt-10 border-t border-slate-800/60 pt-8">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Administradores Ativos
                </h3>
                <div className="rounded-xl border border-slate-800/60 overflow-hidden bg-slate-950/30">
                  <Table>
                    <TableHeader className="bg-slate-950/80 border-b border-slate-800/60">
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Carteira</TableHead>
                        <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Role Atual</TableHead>
                        <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Concessão</TableHead>
                        <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAdmins ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                            Carregando administradores...
                          </TableCell>
                        </TableRow>
                      ) : activeAdmins.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                            Nenhum administrador encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activeAdmins.map((admin) => (
                          <TableRow key={admin.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <TableCell className="font-mono text-slate-300 py-3 text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {admin.walletAddress}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge className="bg-slate-800/80 text-slate-300 border-slate-700 font-mono text-[10px]">{admin.role}</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-slate-400">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  onClick={() => setAdminForm({ wallet: admin.walletAddress, role: admin.role })}
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-3 text-[10px] font-bold bg-slate-800/50 hover:bg-slate-800 hover:text-white text-slate-300 rounded-lg"
                                >
                                  Editar Role
                                </Button>
                                <Button 
                                  onClick={() => handleRevogarAdmin(admin.walletAddress)}
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-3 text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg"
                                >
                                  Revogar Acesso
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
