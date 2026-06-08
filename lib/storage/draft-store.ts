/**
 * lib/storage/draft-store.ts
 *
 * Camada de persistência para rascunhos do Wizard de Tokenização.
 *
 * Estratégia de armazenamento:
 *  - localStorage  → Metadados de texto/números (lake_draft_asset_meta)
 *  - IndexedDB     → Blobs binários pesados (imagem + PDF), via idb-keyval
 *
 * Isso contorna o limite de 5 MB do localStorage e o problema de arquivos
 * File/Blob não sobreviverem ao router.push() do Next.js.
 */

// ─── Chaves ───────────────────────────────────────────────────────────────────
export const META_KEY = "lake_draft_asset_meta";  // localStorage
export const IDB_IMAGE_KEY = "lake_draft_image";  // IndexedDB
export const IDB_PDF_KEY = "lake_draft_pdf";      // IndexedDB
export const PAYMENT_TX_KEY = "lake_tokenize_payment_tx"; // localStorage

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Metadados de texto/números — vai no localStorage */
export interface DraftMeta {
  name: string;
  sector: string;
  tokenNature: string;
  description: string;
  valuation: number;
  tokenCount: number;
  tokenPrice: number;
  treasuryTokens: number;
  royalties: number;
  /** nome original do arquivo de imagem, para exibição */
  coverImageName: string;
  /** MIME type da imagem original */
  coverImageMimeType: string;
  /** nome do PDF (se houver), apenas para exibição */
  pdfFileName?: string;
  /** timestamp ISO de quando o draft foi salvo */
  savedAt: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Importa get/set/del do idb-keyval com fallback silencioso */
async function getIdb() {
  if (typeof window === "undefined") return null;
  try {
    return await import("idb-keyval");
  } catch {
    return null;
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Salva o rascunho completo:
 *   - metadados → localStorage
 *   - imageBlob → IndexedDB (lake_draft_image)
 *   - pdfBlob   → IndexedDB (lake_draft_pdf, se houver)
 */
export async function saveDraft(meta: DraftMeta, imageBlob: Blob, pdfBlob?: Blob | null): Promise<void> {
  // Metadados (leve — sem binários)
  localStorage.setItem(META_KEY, JSON.stringify(meta));

  // Binários → IndexedDB
  const idb = await getIdb();
  if (idb) {
    await idb.set(IDB_IMAGE_KEY, imageBlob);
    if (pdfBlob) {
      await idb.set(IDB_PDF_KEY, pdfBlob);
    } else {
      await idb.del(IDB_PDF_KEY);
    }
  }
}

/**
 * Carrega os metadados do localStorage.
 * Retorna null se não houver rascunho.
 */
export function loadDraftMeta(): DraftMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftMeta;
  } catch {
    return null;
  }
}

/**
 * Carrega a imagem salva no IndexedDB.
 * Retorna null se não existir ou se IndexedDB não estiver disponível.
 */
export async function loadDraftImageBlob(): Promise<Blob | null> {
  const idb = await getIdb();
  if (!idb) return null;
  try {
    const blob = await idb.get<Blob>(IDB_IMAGE_KEY);
    return blob ?? null;
  } catch {
    return null;
  }
}

/**
 * Carrega o PDF salvo no IndexedDB.
 * Retorna null se não existir.
 */
export async function loadDraftPdfBlob(): Promise<Blob | null> {
  const idb = await getIdb();
  if (!idb) return null;
  try {
    const blob = await idb.get<Blob>(IDB_PDF_KEY);
    return blob ?? null;
  } catch {
    return null;
  }
}

/**
 * Limpa tudo (metadados localStorage + IndexedDB).
 * Chamado após cunhagem bem-sucedida.
 */
export async function clearDraft(): Promise<void> {
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(PAYMENT_TX_KEY);
  const idb = await getIdb();
  if (idb) {
    await idb.del(IDB_IMAGE_KEY);
    await idb.del(IDB_PDF_KEY);
  }
}
