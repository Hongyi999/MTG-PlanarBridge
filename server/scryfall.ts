/**
 * Scryfall API client with rate limiting.
 * Scryfall API docs: https://scryfall.com/docs/api
 * Rate limit: max 10 requests per second.
 */

const SCRYFALL_BASE = "https://api.scryfall.com";

export interface ScryfallCard {
  id: string;
  name: string;
  printed_name?: string;
  lang: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
    };
    name: string;
    printed_name?: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
    printed_text?: string;
    printed_type_line?: string;
  }>;
  mana_cost?: string;
  type_line: string;
  printed_type_line?: string;
  oracle_text?: string;
  printed_text?: string;
  colors?: string[];
  color_identity: string[];
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
  legalities: Record<string, string>;
}

interface ScryfallSearchResult {
  object: string;
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
}

interface ScryfallAutocompleteResult {
  object: string;
  total_values: number;
  data: string[];
}

// Rate limiter: max 10 requests/sec = min 100ms between requests
class RateLimiter {
  private queue: Array<() => void> = [];
  private lastRequest = 0;
  private minInterval = 100;
  private processing = false;

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    this.processing = true;
    const now = Date.now();
    const wait = Math.max(0, this.lastRequest + this.minInterval - now);
    setTimeout(() => {
      this.lastRequest = Date.now();
      const resolve = this.queue.shift();
      resolve?.();
      this.processQueue();
    }, wait);
  }
}

const rateLimiter = new RateLimiter();

async function scryfallFetch(url: string): Promise<any> {
  await rateLimiter.acquire();
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MTG-PlanarBridge/1.0",
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ details: res.statusText }));
    const err: any = new Error(body.details || `Scryfall API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Detect if the query contains Chinese characters.
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

/**
 * Search cards. Supports Scryfall search syntax.
 * Auto-detects Chinese input and adjusts the query accordingly.
 */
export async function searchCards(query: string, page: number = 1): Promise<ScryfallSearchResult> {
  let q = query.trim();

  // If the query is plain text (no Scryfall operators) and contains Chinese,
  // search for the printed name in Chinese
  const hasOperators = /[:\!\>\<\=]/.test(q) || q.includes("lang:");
  if (!hasOperators && containsChinese(q)) {
    // Search by Chinese name - use lang:zhs or lang:zht
    q = `lang:zhs ${q}`;
  }

  const url = `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(q)}&page=${page}&include_extras=false&include_multilingual=true`;
  const result: ScryfallSearchResult = await scryfallFetch(url);

  // Normalize cards that have card_faces (double-faced cards)
  result.data = result.data.map(normalizeCard);
  return result;
}

/**
 * Get a card by exact or fuzzy name.
 */
export async function getCardByName(name: string, exact: boolean = false): Promise<ScryfallCard> {
  const param = exact ? "exact" : "fuzzy";
  const url = `${SCRYFALL_BASE}/cards/named?${param}=${encodeURIComponent(name)}`;
  const card: ScryfallCard = await scryfallFetch(url);
  return normalizeCard(card);
}

/**
 * Get a card by Scryfall UUID.
 */
export async function getCardById(scryfallId: string): Promise<ScryfallCard> {
  const url = `${SCRYFALL_BASE}/cards/${scryfallId}`;
  const card: ScryfallCard = await scryfallFetch(url);
  return normalizeCard(card);
}

/**
 * Autocomplete card names (English).
 */
export async function autocomplete(query: string): Promise<string[]> {
  const url = `${SCRYFALL_BASE}/cards/autocomplete?q=${encodeURIComponent(query)}`;
  const result: ScryfallAutocompleteResult = await scryfallFetch(url);
  return result.data;
}

/**
 * Normalize double-faced cards so they always have image_uris at the top level.
 */
function normalizeCard(card: ScryfallCard): ScryfallCard {
  if (!card.image_uris && card.card_faces && card.card_faces.length > 0) {
    card.image_uris = card.card_faces[0].image_uris as any;
    if (!card.oracle_text && card.card_faces[0].oracle_text) {
      card.oracle_text = card.card_faces.map(f => f.oracle_text).filter(Boolean).join("\n---\n");
    }
    if (!card.printed_text && card.card_faces[0].printed_text) {
      card.printed_text = card.card_faces.map(f => f.printed_text).filter(Boolean).join("\n---\n");
    }
    if (!card.printed_name && card.card_faces[0].printed_name) {
      card.printed_name = card.card_faces.map(f => f.printed_name).filter(Boolean).join(" // ");
    }
    if (!card.printed_type_line && card.card_faces[0].printed_type_line) {
      card.printed_type_line = card.card_faces.map(f => f.printed_type_line).filter(Boolean).join(" // ");
    }
  }
  return card;
}
