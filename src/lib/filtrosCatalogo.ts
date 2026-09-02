import type { SugestaoLancamento } from "../types";

export type FiltroJogo = "todos" | "steam" | "pc" | "xbox" | "playstation";
export const FILTROS_JOGOS: { id: FiltroJogo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" }, { id: "steam", rotulo: "Steam" },
  { id: "pc", rotulo: "PC" }, { id: "xbox", rotulo: "Xbox" },
  { id: "playstation", rotulo: "PlayStation" },
];

export function normalizarTexto(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function urlExternaSegura(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  try {
    const url = new URL(valor);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function correspondePlataforma(item: SugestaoLancamento, filtro: FiltroJogo): boolean {
  if (filtro === "todos") return true;
  if (item.categoria !== "jogos") return false;
  const plataformas = normalizarTexto((item.plataformas ?? []).join(" "));
  const steam = /\bsteam\b/.test(plataformas) || item.fonte === "steam" ||
    (item.linksOficiais ?? []).some(({ url }) => {
      try { return new URL(urlExternaSegura(url) ?? "").hostname === "store.steampowered.com"; } catch { return false; }
    });
  if (filtro === "steam") return steam;
  if (filtro === "pc") return steam || /\bpc\b|windows|linux|macos|\bmac\b|\bgog\b|epic games/.test(plataformas);
  if (filtro === "xbox") return /\bxbox\b/.test(plataformas);
  return /playstation|\bps[345]\b/.test(plataformas);
}

export function dentroDaJanelaAtual(item: SugestaoLancamento, agora = Date.now()): boolean {
  const data = Date.parse(item.dataLancamentoISO);
  if (!Number.isFinite(data)) return false;
  const dias = item.categoria === "filmes" ? 183 : item.categoria === "series" ? 548 : Infinity;
  return data >= agora - dias * 86_400_000;
}

export function jogoApropriadoERelevante(item: SugestaoLancamento): boolean {
  return item.categoria !== "jogos" || !/hentai|adult|erotic|sexual|nsfw|nudity|porn/.test(normalizarTexto(`${item.titulo} ${item.descricao ?? ""}`));
}

/** Datas do catálogo são dias de lançamento, não horários no fuso do aparelho. */
export function formatarDataLancamento(iso: string): string {
  const data = new Date(iso);
  return Number.isFinite(data.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(data)
    : "Data a confirmar";
}
