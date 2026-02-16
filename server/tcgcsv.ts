/**
 * TCGCSV API Client - Free TCGPlayer price data mirror
 *
 * Free, no API key required.
 * Provides TCGPlayer pricing for multiple TCGs including FAB.
 * Docs: https://tcgcsv.com
 */

// FAB category ID on TCGPlayer = 65
const FAB_CATEGORY_ID = 65;
const TCGCSV_BASE = "https://tcgcsv.com";

export interface TCGCSVProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  groupId: number;
  url: string;
  modifiedOn: string;
  extendedData?: { name: string; value: string }[];
}

export interface TCGCSVPrice {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName: string; // "Normal", "Foil", etc.
}

export interface TCGCSVGroup {
  groupId: number;
  name: string;
  abbreviation: string;
  supplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
}

/**
 * Get all FAB sets/groups
 */
export async function getFaBGroups(): Promise<TCGCSVGroup[]> {
  const res = await fetch(`${TCGCSV_BASE}/${FAB_CATEGORY_ID}/groups`);
  if (!res.ok) throw new Error(`TCGCSV groups fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

/**
 * Get products (cards) for a FAB group/set
 */
export async function getFaBProducts(groupId: number): Promise<TCGCSVProduct[]> {
  const res = await fetch(`${TCGCSV_BASE}/${FAB_CATEGORY_ID}/${groupId}/products`);
  if (!res.ok) throw new Error(`TCGCSV products fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

/**
 * Get prices for a FAB group/set
 */
export async function getFaBPrices(groupId: number): Promise<TCGCSVPrice[]> {
  const res = await fetch(`${TCGCSV_BASE}/${FAB_CATEGORY_ID}/${groupId}/prices`);
  if (!res.ok) throw new Error(`TCGCSV prices fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

/**
 * Search FAB products by name across all groups (searches cached data)
 * Note: TCGCSV doesn't have a search endpoint, so this fetches all products
 * from recent sets and filters locally. For production, cache this data.
 */
export async function searchFaBPriceByName(
  productName: string,
  products: TCGCSVProduct[],
  prices: TCGCSVPrice[]
): Promise<{ product: TCGCSVProduct; price: TCGCSVPrice | null } | null> {
  const cleanQuery = productName.toLowerCase().trim();
  const match = products.find(
    p => p.cleanName.toLowerCase() === cleanQuery || p.name.toLowerCase().includes(cleanQuery)
  );

  if (!match) return null;

  const price = prices.find(
    p => p.productId === match.productId && p.subTypeName === "Normal"
  ) || prices.find(p => p.productId === match.productId) || null;

  return { product: match, price };
}
