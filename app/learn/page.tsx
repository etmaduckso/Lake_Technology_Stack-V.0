import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, User } from "lucide-react";
import Image from "next/image";

type Article = {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  category: string;
  image: string;
};

const articles: Article[] = [
  {
    id: "1",
    title: "Fundamentos RWA: O que são e como funcionam",
    summary: "Descubra como os Ativos de Mundo Real (RWA) estão revolucionando o mercado financeiro e trazendo liquidez para ativos ilíquidos.",
    author: "Lake Research",
    date: "10 de Maio, 2024",
    category: "Fundamentos",
    image: "/brand/lake-wave-banner.png"
  },
  {
    id: "2",
    title: "Segurança Jurídica na Tokenização",
    summary: "Entenda os aspectos legais e como a plataforma Lake se alinha às regulações da CVM para garantir máxima segurança aos investidores.",
    author: "Legal Team",
    date: "15 de Maio, 2024",
    category: "Jurídico",
    image: "/brand/lake-wave-banner.png"
  },
  {
    id: "3",
    title: "Tecnologia Solana e Velocidade Institucional",
    summary: "Por que escolhemos a Solana? Uma análise profunda sobre a infraestrutura tecnológica que permite transações instantâneas.",
    author: "Tech Lead",
    date: "20 de Maio, 2024",
    category: "Tecnologia",
    image: "/brand/lake-wave-banner.png"
  }
];

export default function KnowledgeHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 mb-6">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-emerald-400">Hub de Leitura</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Central de Conhecimento <span className="text-emerald-400">RWA</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Explore nossos artigos, guias teóricos e relatórios aprofundados sobre a tokenização de ativos do mundo real.
          </p>
        </div>
      </div>

      {/* Grid de Artigos */}
      <div className="container mx-auto px-4 mt-12 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardHeader className="space-y-3 pb-4">
                <Badge variant="secondary" className="w-fit bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                  {article.category}
                </Badge>
                <CardTitle className="text-xl leading-tight group-hover:text-emerald-600 transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-base">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
