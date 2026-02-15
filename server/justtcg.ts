/**
 * JustTCG API Client
 *
 * Multi-source TCG pricing API with price history support.
 * Requires API key (free tier available).
 * Real-time pricing updates.
 *
 * API Documentation: https://justtcg.com/docs
 * Sign up: https://justtcg.com
 */

export interface JustTCGCard {
  tcgplayerId: number;
  name: string;
  set: string;
  rarity: string;
  condition: string; // "NM", "LP", "MP", "HP", "DMG"
  variant?: string;  // "normal" | "foil"
  price: number;
  currency: string;  // "USD"
  lastUpdated: string;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
}

export interface JustTCGPriceHistory {
  tcgplayerId: number;
  date: string;
  price: number;
  condition: string;
}

const JUSTTCG_BASE_URL = "https://api.justtcg.com/v1";

/**
 * Get current price for a card
 * @param tcgplayerId TCGPlayer product ID
 * @param condition Card condition (default: "NM")
 * @param variant "normal" or "foil"
 */
export async function getCardPrice(
  tcgplayerId: number,
  condition: string = "NM",
  variant: "normal" | "foil" = "normal"
): Promise<JustTCGCard | null> {
  const apiKey = process.env.JUSTTCG_API_KEY;

  if (!apiKey) {
    console.warn("[JustTCG] API key not configured. Set JUSTTCG_API_KEY in .env");
    return null;
  }

  try {
    const url = `${JUSTTCG_BASE_URL}/cards/${tcgplayerId}?condition=${condition}&variant=${variant}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      if (response.status === 401) {
        console.error("[JustTCG] Invalid API key");
        return null;
      }
      if (response.status === 429) {
        console.error("[JustTCG] Rate limit exceeded");
        return null;
      }
      throw new Error(`JustTCG API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[JustTCG] Failed to fetch price for TCGPlayer ID ${tcgplayerId}:`, error.message);
    return null;
  }
}

/**
 * Get price history for a card
 * @param tcgplayerId TCGPlayer product ID
 * @param days Number of days (7, 30, 90, or 180)
 * @param condition Card condition (default: "NM")
 */
export async function getPriceHistory(
  tcgplayerId: number,
  days: 7 | 30 | 90 | 180 = 30,
  condition: string = "NM"
): Promise<JustTCGPriceHistory[]> {
  const apiKey = process.env.JUSTTCG_API_KEY;

  if (!apiKey) {
    console.warn("[JustTCG] API key not configured. Set JUSTTCG_API_KEY in .env");
    return [];
  }

  try {
    const url = `${JUSTTCG_BASE_URL}/cards/${tcgplayerId}/history?days=${days}&condition=${condition}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      if (response.status === 401) {
        console.error("[JustTCG] Invalid API key");
        return [];
      }
      throw new Error(`JustTCG API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error: any) {
    console.error(`[JustTCG] Failed to fetch price history for TCGPlayer ID ${tcgplayerId}:`, error.message);
    return [];
  }
}

/**
 * Bulk card price lookup (up to 20 cards in free tier)
 * @param tcgplayerIds Array of TCGPlayer product IDs
 */
export async function getBulkPrices(tcgplayerIds: number[]): Promise<JustTCGCard[]> {
  const apiKey = process.env.JUSTTCG_API_KEY;

  if (!apiKey) {
    console.warn("[JustTCG] API key not configured. Set JUSTTCG_API_KEY in .env");
    return [];
  }

  if (tcgplayerIds.length === 0) return [];
  if (tcgplayerIds.length > 20) {
    console.warn("[JustTCG] Free tier limited to 20 cards per request. Truncating.");
    tcgplayerIds = tcgplayerIds.slice(0, 20);
  }

  try {
    const url = `${JUSTTCG_BASE_URL}/cards`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tcgplayerIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("[JustTCG] Invalid API key");
        return [];
      }
      throw new Error(`JustTCG API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.cards || [];
  } catch (error: any) {
    console.error(`[JustTCG] Bulk fetch failed:`, error.message);
    return [];
  }
}
