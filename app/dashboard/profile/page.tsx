"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/wallet-context";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useNetworkHub } from "@/context/NetworkContext";
import { 
  Award, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  BadgeCheck, 
  FileText, 
  Code, 
  Wallet,
  Star,
  Zap,
  TrendingUp,
  Camera
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";

interface Contribution {
  id: string;
  activity: string;
  type: string;
  credits: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "REVIEW";
}

const CONTRIBUTION_HISTORY: Contribution[] = [
  {
    id: "1",
    activity: "Leitura do Artigo: Fundamentos RWA e Liquidez",
    type: "Educação",
    credits: "+10 LKT",
    date: "24 Maio 2026",
    status: "COMPLETED",
  },
  {
    id: "2",
    activity: "Validação de Código: PR #20 Resolução de Conflitos Híbridos",
    type: "Desenvolvimento",
    credits: "+50 LKT",
    date: "23 Maio 2026",
    status: "COMPLETED",
  },
  {
    id: "3",
    activity: "Inscrição no Colosseum Hackathon (Side Tracks)",
    type: "Ecossistema",
    credits: "+100 LKT",
    date: "22 Maio 2026",
    status: "COMPLETED",
  },
  {
    id: "4",
    activity: "Aprovação de Parâmetros de Listagem no Mercado Primário",
    type: "Governança",
    credits: "+30 LKT",
    date: "21 Maio 2026",
    status: "COMPLETED",
  },
  {
    id: "5",
    activity: "Feedback Técnico de UI/UX do Hub de Leitura",
    type: "Comunidade",
    credits: "+15 LKT",
    date: "18 Maio 2026",
    status: "COMPLETED",
  }
];

export default function VIPProfilePage() {
  const { walletAddress, connectWallet } = useWallet();
  const { publicKey, connected } = useSolanaWallet();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { sbtNickname, sbtAvatarUrl } = useNetworkHub();
  const [copied, setCopied] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checking && !connected) {
      setCustomImage(null);
      setCopied(false);
      router.push("/");
    }
  }, [checking, connected, publicKey, router]);

  useEffect(() => {
    setCustomImage(null);
    setCopied(false);
  }, [publicKey]);

  // Desmontagem Forçada para evitar Flicker visual de vazamento de dados
  if (!checking && !connected) {
    return null;
  }

  // Trava de segurança: Acesso Restrito se conectado mas não for VIP
  if (!checking && connected && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Card className="bg-slate-900/60 border-slate-800/80 shadow-2xl backdrop-blur-md max-w-md w-full text-center p-8">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Acesso Restrito</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Área Exclusiva de Governança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Esta seção é destinada exclusivamente aos Embaixadores VIP credenciados pela Lake. O status VIP é uma atribuição exclusiva de governança e não pode ser comprado ou ativado na UI.
            </p>
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-500 text-left truncate">
              Wallet: {walletAddress}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push("/dashboard/investor")} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Voltar ao Portfólio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setCustomImage(localUrl);
    }
  };

  // Fallback wallet address for VIP ambassadors when not connected
  const displayWallet = walletAddress || "LakeAmba55ad0r789XyZ1234567890123456789";

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(displayWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: Contribution["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Concluído</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Pendente</Badge>;
      case "REVIEW":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Em Revisão</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Educação":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case "Desenvolvimento":
        return <Code className="w-4 h-4 text-indigo-400" />;
      case "Ecossistema":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "Governança":
        return <ShieldCheck className="w-4 h-4 text-teal-400" />;
      default:
        return <Star className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      
      {/* Cabeçalho do Perfil do Usuário */}
      <div className="bg-slate-900 border-b border-slate-800 py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            
            {/* Info do Usuário */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 p-[2px] shadow-lg shadow-emerald-500/10 overflow-hidden">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-extrabold text-2xl tracking-wider text-white overflow-hidden">
                    {(sbtAvatarUrl || customImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={sbtAvatarUrl || customImage || ""} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (sbtNickname ? sbtNickname.slice(0, 2).toUpperCase() : "CA")
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-2 border-slate-900 text-slate-950 p-1.5 rounded-xl shadow-md">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {sbtNickname || "Cezar Ambassador"}
                  </h1>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
                    Embaixador VIP • Nível 3
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm max-w-md">
                  Contribuindo para o crescimento do ecossistema de tokenização de Ativos do Mundo Real (RWA).
                </p>

                {/* Wallet Info */}
                <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 w-fit mx-auto md:mx-0">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {displayWallet.substring(0, 8)}...{displayWallet.substring(displayWallet.length - 8)}
                  </span>
                  <button 
                    onClick={handleCopyWallet}
                    className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                    title="Copiar Endereço"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {connected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Conectado
                    </span>
                  ) : (
                    <button 
                      onClick={connectWallet}
                      className="text-[10px] text-indigo-400 font-bold hover:underline ml-2 border-l border-slate-700 pl-2"
                    >
                      Conectar Carteira Real
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 bg-slate-800/40 border border-slate-800 p-6 rounded-2xl w-full md:w-auto min-w-[320px]">
              <div className="text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Créditos LKT</p>
                <p className="text-2xl font-extrabold text-white">2.450</p>
              </div>
              <div className="text-center border-x border-slate-800 px-4">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Contribuições</p>
                <p className="text-2xl font-extrabold text-white">32</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Poder de Voto</p>
                <p className="text-2xl font-extrabold text-emerald-400">12.5x</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 mt-12 max-w-6xl grid lg:grid-cols-3 gap-8">
        
        {/* Seção Destaque: Crachá Soulbound */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Efeitos visuais do Soulbound Token */}
            <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-[150px] -right-[150px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]"></div>
            
            <CardHeader className="text-center border-b border-slate-800/60 pb-6">
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 w-fit mx-auto mb-2 text-[10px] font-bold tracking-widest uppercase">
                Web3 Soulbound Token (SBT)
              </Badge>
              <CardTitle className="text-lg font-bold text-white">Crachá de Embaixador</CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                Certificado Digital de Governança
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-8 flex flex-col items-center">
              {/* Crachá Premium Holográfico */}
              <div className="relative group cursor-pointer mb-6">
                
                {/* Glow externo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-3xl blur-[12px] opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                
                {/* Corpo do Crachá */}
                <div className="relative w-48 h-64 bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-4 flex flex-col justify-between items-center text-center shadow-2xl transform group-hover:scale-[1.02] transition-all duration-300">
                  
                  {/* Linha Decorativa Superior */}
                  <div className="w-full flex justify-between items-center px-1">
                    <span className="text-[8px] font-mono text-emerald-400/60 tracking-wider">LAKE VIP v1.0</span>
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  {/* Símbolo do Embaixador / Imagem Customizada */}
                  <div className="relative my-4 flex items-center justify-center w-24 h-24">
                    {(sbtAvatarUrl || customImage) ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400/50 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {/* Imagem do Usuário */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={sbtAvatarUrl || customImage || ""} 
                          alt="Preview do Crachá" 
                          className="w-full h-full object-cover filter saturate-125 contrast-110"
                        />
                        {/* Overlay de Brilho Glassmorphic */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/10 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border-2 border-emerald-400/30 flex items-center justify-center animate-spin-slow">
                        <Award className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      </div>
                    )}
                    {/* Elementos Estrelares adicionais */}
                    <div className="absolute top-1 right-1 text-indigo-400 animate-bounce">
                      <Star className="w-3.5 h-3.5 fill-indigo-400" />
                    </div>
                  </div>

                  {/* Informações no Badge */}
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Embaixador</p>
                    <p className="text-sm font-black text-white tracking-tight uppercase">
                      {sbtNickname || "Lake VIP Ambassador"}
                    </p>
                  </div>

                  {/* Detalhes de Emissão */}
                  <div className="w-full border-t border-slate-800/80 pt-2.5 flex justify-between items-center text-[8px] font-mono text-slate-400 px-1">
                    <span>STATUS: ATIVO</span>
                    <span className="text-emerald-400">ID: #0020</span>
                  </div>
                </div>
              </div>

              {/* Botão de Alterar Imagem */}
              <div className="mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 text-[11px] font-bold py-1.5 h-8 flex items-center gap-1.5 rounded-lg"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Alterar Imagem do Crachá
                </Button>
              </div>

              {/* Descrição e Regras */}
              <p className="text-slate-400 text-xs text-center leading-relaxed px-4">
                Este crachá é intransferível e está vinculado à sua identidade criptográfica na LakeTokeniza, concedendo poder de voto expandido em decisões institucionais.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-0 pb-6 px-6">
              
              {/* Botão Intent Compartilhamento X */}
              <Button 
                asChild
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 rounded-xl py-5"
              >
                <a 
                  href="https://x.com/intent/tweet?text=Acabei%20de%20conquistar%20o%20meu%20Crach%C3%A1%20VIP%20na%20LakeTokeniza!%20🚀"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar no X (Twitter)
                </a>
              </Button>

              <div className="text-[10px] text-slate-500 text-center flex flex-col gap-2 font-mono">
                <p className="text-[9px] text-slate-500 leading-normal max-w-[240px] mx-auto italic font-sans">
                  Nota: Esta imagem será eternizada na rede Arweave de forma imutável durante a cunhagem do seu SBT.
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span>Contrato:</span>
                  <span className="underline truncate max-w-[150px]" title="0xSoulboundLakeTokenizaBadgev1">0xSBT...Lakev1</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Histórico de Contribuições */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800/80 shadow-xl backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/60 pb-6">
              <div>
                <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Meu Histórico de Contribuições
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                  Ações que geraram pontos de reputação e poder de governança
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Total: 5 Concluídas
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader className="border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Atividade</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Tipo</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider text-right">Créditos</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Data</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTRIBUTION_HISTORY.map((item) => (
                    <TableRow key={item.id} className="border-slate-850 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-semibold text-slate-200 py-4 max-w-[280px] md:max-w-none truncate">
                        {item.activity}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="flex items-center gap-2 text-xs text-slate-300">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-4 font-mono font-extrabold text-emerald-400">
                        {item.credits}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-slate-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {item.date}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
