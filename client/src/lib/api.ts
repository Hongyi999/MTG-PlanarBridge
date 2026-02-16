/**
 * Frontend API helpers for Scryfall card search and data fetching.
 */

export interface CardData {
  id?: number;
  scryfall_id: string;
  name_en: string;
  name_cn?: string | null;
  image_uri?: string | null;
  image_uri_small?: string | null;
  set_code?: string | null;
  set_name?: string | null;
  collector_number?: string | null;
  mana_cost?: string | null;
  type_line?: string | null;
  type_line_cn?: string | null;
  oracle_text?: string | null;
  oracle_text_cn?: string | null;
  colors?: string[] | null;
  color_identity?: string[] | null;
  rarity?: string | null;
  prices: {
    usd?: number | null;
    usd_foil?: number | null;
    eur?: number | null;
    tix?: number | null;
    cny_converted?: number | null;
    jpy_converted?: number | null;
  };
  legalities?: Record<string, string> | null;
  cached_at?: string | null;
}

export interface SearchResult {
  cards: CardData[];
  total_cards: number;
  has_more: boolean;
  next_page?: number;
}

export async function searchCards(query: string, page: number = 1): Promise<SearchResult> {
  const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Search failed: ${res.status}`);
  }
  return res.json();
}

export async function getCard(scryfallId: string): Promise<CardData> {
  const res = await fetch(`/api/cards/scryfall/${scryfallId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Card not found: ${res.status}`);
  }
  return res.json();
}

export async function autocompleteCards(query: string): Promise<string[]> {
  const res = await fetch(`/api/cards/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function getExchangeRates(): Promise<{ usd_to_cny: number; usd_to_jpy: number }> {
  const res = await fetch("/api/exchange-rates");
  if (!res.ok) return { usd_to_cny: 7.25, usd_to_jpy: 150 };
  return res.json();
}

/** Format a price with currency symbol */
export function formatPrice(amount: number | null | undefined, currency: "usd" | "cny" | "jpy" | "eur" = "usd"): string {
  if (amount === null || amount === undefined) return "N/A";
  switch (currency) {
    case "usd": return `$${amount.toFixed(2)}`;
    case "eur": return `€${amount.toFixed(2)}`;
    case "cny": return `¥${amount.toFixed(2)}`;
    case "jpy": return `¥${Math.round(amount).toLocaleString()}`;
  }
}

/** Get display name (prefer Chinese, fall back to English) */
export function getDisplayName(card: CardData): string {
  return card.name_cn || card.name_en;
}

/** Format legality for display */
const LEGALITY_LABELS: Record<string, string> = {
  standard: "Standard",
  pioneer: "Pioneer",
  modern: "Modern",
  legacy: "Legacy",
  vintage: "Vintage",
  commander: "Commander",
  pauper: "Pauper",
};

export function getKeyLegalities(legalities: Record<string, string> | null | undefined) {
  if (!legalities) return [];
  return Object.entries(LEGALITY_LABELS).map(([key, label]) => ({
    format: label,
    status: legalities[key] || "not_legal",
    legal: legalities[key] === "legal",
  }));
}

/** Price History Types and API */

export interface PriceHistoryEntry {
  id: number;
  scryfallId: string;
  source: "scryfall" | "tcgtracking" | "justtcg" | "cardmarket" | "wisdomguild" | "manual";
  condition: string;
  priceUsd: number | null;
  priceUsdFoil: number | null;
  priceEur: number | null;
  priceTix: number | null;
  priceCny: number | null;
  priceJpy: number | null;
  exchangeRateUsdCny: number | null;
  exchangeRateUsdJpy: number | null;
  recordedAt: string;
}

/**
 * Get price history for a card
 * @param scryfallId Scryfall card ID
 * @param days Number of days of history to fetch (default: 90)
 */
export async function getPriceHistory(
  scryfallId: string,
  days: number = 90
): Promise<PriceHistoryEntry[]> {
  const res = await fetch(`/api/price-history/${scryfallId}?days=${days}`);
  if (!res.ok) {
    console.error(`Failed to fetch price history: ${res.status}`);
    return [];
  }
  return res.json();
}

/**
 * Get the latest price snapshot for a card
 * @param scryfallId Scryfall card ID
 * @param source Optional: filter by specific source
 */
export async function getLatestPriceSnapshot(
  scryfallId: string,
  source?: string
): Promise<PriceHistoryEntry | null> {
  const url = source
    ? `/api/price-history/${scryfallId}/latest?source=${source}`
    : `/api/price-history/${scryfallId}/latest`;

  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Manually trigger a price snapshot for all followed cards (admin/debug)
 */
export async function triggerPriceSnapshot(): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/price-history/snapshot", {
    method: "POST",
  });
  if (!res.ok) {
    return { success: false, message: res.statusText };
  }
  return res.json();
}
