import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, dictionaries, LOCALES, type Dict, type Locale } from "./dictionaries";

const LOCALE_COOKIE = "lake_locale";

function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

function pickFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const tags = header.split(",").map((tag) => tag.trim().split(";")[0]?.toLowerCase() ?? "");
  for (const tag of tags) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

export async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const h = await headers();
  const country = (h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "").toUpperCase();
  if (country === "BR") return "pt-BR";

  const fromHeader = pickFromAcceptLanguage(h.get("accept-language"));
  if (fromHeader) return fromHeader;

  return DEFAULT_LOCALE;
}

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

export async function getServerDict(): Promise<{ locale: Locale; dict: Dict }> {
  const locale = await detectLocale();
  return { locale, dict: dictionaries[locale] };
}

export { LOCALE_COOKIE };
