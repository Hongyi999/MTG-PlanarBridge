/**
 * FaBDB API Client - Flesh and Blood card data
 *
 * Free API, no key required.
 * Docs: https://fabdb.net/resources/api
 */

export interface FaBCard {
  identifier: string;  // e.g. "ARC000"
  name: string;
  text?: string;
  cost?: string;
  pitch?: string;
  power?: string;
  defense?: string;
  health?: string;
  intelligence?: string;
  rarity?: string;
  keywords?: string[];
  image?: string;
  printings?: { id: string; set_id: string; edition: string; image: string }[];
}

export interface FaBSearchResult {
  data: FaBCard[];
  current_page: number;
  last_page: number;
  total: number;
}

const FABDB_BASE = "https://api.fabdb.net";

// Rate limit: be respectful (100ms between requests)
let lastRequest = 0;
async function rateLimited() {
  const now = Date.now();
  const wait = Math.max(0, 100 - (now - lastRequest));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
}

/**
 * Search FAB cards by keyword
 */
export async function searchFaBCards(query: string, page: number = 1): Promise<FaBSearchResult> {
  await rateLimited();
  const url = `${FABDB_BASE}/cards?per_page=20&page=${page}&keywords=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`FaBDB search failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    data: data.data || [],
    current_page: data.current_page || page,
    last_page: data.last_page || 1,
    total: data.total || 0,
  };
}

/**
 * Get a single FAB card by identifier
 */
export async function getFaBCard(identifier: string): Promise<FaBCard | null> {
  await rateLimited();
  const url = `${FABDB_BASE}/cards/${identifier}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`FaBDB card fetch failed: ${res.status}`);
  }

  return await res.json();
}
