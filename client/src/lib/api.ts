import type { Card as DBCard } from "@shared/schema";

export interface CardSearchResult {
  cards: DBCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchCards(params: {
  game: string;
  search?: string;
  page?: number;
  limit?: number;
  setCode?: string;
  rarity?: string;
}): Promise<CardSearchResult> {
  const query = new URLSearchParams();
  query.set("game", params.game);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.setCode) query.set("set_code", params.setCode);
  if (params.rarity) query.set("rarity", params.rarity);

  const res = await fetch(`/api/cards?${query}`);
  return res.json();
}

export async function getCard(id: number): Promise<DBCard> {
  const res = await fetch(`/api/cards/${id}`);
  return res.json();
}

export async function triggerImport(game: "mtg" | "fab"): Promise<any> {
  const res = await fetch(`/api/import/${game}`, { method: "POST" });
  return res.json();
}

export async function getImportStatus(): Promise<any[]> {
  const res = await fetch("/api/import/status");
  return res.json();
}
