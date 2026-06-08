/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — API Middleware (middleware.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * RESPONSABILIDADE
 * ----------------
 * Primeira linha de defesa para todas as rotas de API. Aplica:
 *
 *   1. CORS Guard — bloqueia requisições de origem desconhecida para operações
 *      de escrita (POST, PATCH, DELETE). Leitura (GET) permanece pública.
 *
 *   2. Content-Type Guard — requisições de escrita DEVEM ter Content-Type
 *      application/json ou multipart/form-data.
 *
 *   3. Security Headers — adiciona cabeçalhos de segurança padrão a todas as
 *      respostas de API (X-Content-Type-Options, X-Frame-Options, etc).
 *
 * LIMITAÇÕES ATUAIS
 * -----------------
 * Este middleware NÃO implementa autenticação por JWT ou Cookie de Sessão.
 * A autenticação completa (signMessage challenge-response) é prevista para
 * a FASE 2 da hardening de segurança, conforme aprovação do Tech Lead.
 *
 * Por ora, a validação de ownership é feita em cada rota individualmente
 * via verificação de transactionSignature no Solana RPC.
 *
 * ROTAS PROTEGIDAS
 * ----------------
 * Todas as rotas em /api/** são interceptadas.
 * Rotas públicas de leitura (GET) são permitidas sem restrição.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Origens permitidas ───────────────────────────────────────────────────────

/** Origens explicitamente permitidas para operações de escrita */
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'https://laketokeniza.vercel.app',
  // Adicionar domínio de produção aqui quando disponível
  // 'https://laketokeniza.com',
  // 'https://app.laketokeniza.com',
]);

/** Métodos que representam operações de escrita — exigem validação de origem */
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// ─── Cabeçalhos de segurança aplicados a todas as respostas de API ─────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Powered-By': 'LakeTokeniza',          // Substitui header padrão do Next.js
  'Cache-Control': 'no-store, no-cache',    // API routes nunca cacheadas
};

// ─── Middleware Handler ───────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname, origin: reqOrigin } = new URL(request.url);
  const method = request.method;
  const requestOrigin = request.headers.get('origin');

  // ── Só interceptar rotas de API ──────────────────────────────────────────────
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ── Preflight CORS (OPTIONS) ──────────────────────────────────────────────────
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    applySecurityHeaders(response, requestOrigin);
    return response;
  }

  // ── CORS Guard para operações de escrita ──────────────────────────────────────
  if (WRITE_METHODS.has(method)) {
    // Em desenvolvimento, permitir requests sem header 'origin' (ferramentas como curl, Postman)
    if (requestOrigin && !ALLOWED_ORIGINS.has(requestOrigin)) {
      console.warn(
        `[Middleware] ❌ CORS bloqueado: origin=${requestOrigin} | method=${method} | path=${pathname}`,
      );
      return NextResponse.json(
        { error: 'Origem não autorizada.' },
        { status: 403 },
      );
    }

    // Content-Type Guard: escrita deve ter content-type correto
    const contentType = request.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const isMultipart = contentType.includes('multipart/form-data');

    // Exceção: DELETE sem body não precisa de Content-Type
    if (method !== 'DELETE' && !isJson && !isMultipart) {
      console.warn(
        `[Middleware] ❌ Content-Type inválido: ${contentType} | path=${pathname}`,
      );
      return NextResponse.json(
        { error: 'Content-Type inválido. Use application/json ou multipart/form-data.' },
        { status: 415 },
      );
    }
  }

  // ── Prosseguir com a requisição e adicionar security headers na resposta ───────
  const response = NextResponse.next();
  applySecurityHeaders(response, requestOrigin);
  return response;
}

// ─── Helper: Aplicar cabeçalhos de segurança ──────────────────────────────────

function applySecurityHeaders(response: NextResponse, origin: string | null): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS: permitir credenciais somente de origens conhecidas
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}

// ─── Configuração do Matcher ──────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Interceptar todas as rotas de API (/api/**).
     * Excluir: _next internals, static files, favicon.
     */
    '/api/:path*',
  ],
};
