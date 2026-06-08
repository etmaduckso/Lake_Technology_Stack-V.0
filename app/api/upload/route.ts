/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — Upload Route (POST /api/upload)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * RESPONSABILIDADE
 * ----------------
 * Rota desativada por razões de segurança (Não-Custodial por Design).
 * Todo upload agora é feito client-side via Irys Web SDK no navegador.
 *
 * SEGURANÇA
 * ----------
 * Retorna 403 Forbidden para desativar a custódia de chaves privadas no servidor.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'Uploads custodiados pelo servidor foram desativados por motivos de segurança. Toda operação de upload deve ser realizada diretamente pelo navegador do cliente (não-custodial) utilizando o Irys Web SDK.',
    },
    { status: 403 },
  );
}
