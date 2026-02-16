/**
 * TCGTracking API Client
 *
 * Free TCGPlayer price data with no API key required.
 * Updates daily at 8 AM EST.
 * Provides condition-specific pricing (NM, LP, MP, HP, DMG).
 *
 * API Documentation: https://tcgtracking.com/tcgapi/
 */

export interface TCGTrackingPrice {
  tcgplayerId: number;
  name: string;
  set: string;
  number: string;
  rarity: string;
  type: string;
  // Condition-specific prices
  nmPrice?: number;      // Near Mint
  nmFoilPrice?: number;
  lpPrice?: number;      // Lightly Played
  lpFoilPrice?: number;
  mpPrice?: number;      // Moderately Played
  mpFoilPrice?: number;
  hpPrice?: number;      // Heavily Played
  hpFoilPrice?: number;
  dmgPrice?: number;     // Damaged
  dmgFoilPrice?: number;
  // Market prices (lowest listing)
  marketPrice?: number;
  marketFoilPrice?: number;
}

const TCGTRACKING_BASE_URL = "https://tcgtracking.com/tcgapi";

/**
 * Search for a card by name
 * Returns TCGPlayer pricing data with condition breakdown
 */
export async function searchCardByName(cardName: string): Promise<TCGTrackingPrice[]> {
  try {
    const url = `${TCGTRACKING_BASE_URL}/search?name=${encodeURIComponent(cardName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TCGTracking API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.cards || [];
  } catch (error: any) {
    console.error(`[TCGTracking] Search failed for "${cardName}":`, error.message);
    return [];
  }
}

/**
 * Get card price by TCGPlayer ID
 * More accurate than name search if TCGPlayer ID is known
 */
export async function getCardPriceById(tcgplayerId: number): Promise<TCGTrackingPrice | null> {
  try {
    const url = `${TCGTRACKING_BASE_URL}/card/${tcgplayerId}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`TCGTracking API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[TCGTracking] Fetch failed for TCGPlayer ID ${tcgplayerId}:`, error.message);
    return null;
  }
}

/**
 * Get Near Mint price for a card (standard default condition)
 */
export function getNearMintPrice(card: TCGTrackingPrice, foil: boolean = false): number | null {
  if (foil) {
    return card.nmFoilPrice ?? card.marketFoilPrice ?? null;
  }
  return card.nmPrice ?? card.marketPrice ?? null;
}
