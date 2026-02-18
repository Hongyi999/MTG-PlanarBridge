/**
 * FAB Price Cache - Fetches and caches TCGPlayer prices for Flesh and Blood cards
 *
 * Uses the TCGCSV API (free, no key required) which mirrors TCGPlayer data.
 * Prices are keyed by tcgplayer_product_id and refreshed every 24 hours.
 */

import { getFaBGroups, getFaBPrices } from "./tcgcsv";

export interface FaBPriceEntry {
  usd: number | null;       // Normal / market price
  usd_foil: number | null;  // Foil market price (Rainbow Foil, Cold Foil, etc.)
}

class FaBPriceCache {
  private priceMap: Map<number, FaBPriceEntry> = new Map();
  private lastFetched: Date | null = null;
  private loadPromise: Promise<void> | null = null;

  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly BATCH_SIZE = 5; // groups fetched in parallel per round

  /** Returns true if prices are stale or have never been loaded */
  private isStale(): boolean {
    return !this.lastFetched || Date.now() - this.lastFetched.getTime() >= this.CACHE_TTL_MS;
  }

  /**
   * Ensure prices are loaded. Safe to call concurrently; only one fetch runs at a time.
   * Does NOT throw on failure - callers always get prices (null if unavailable).
   */
  async ensureLoaded(): Promise<void> {
    if (!this.isStale()) return;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.load().finally(() => {
      this.loadPromise = null;
    });
    return this.loadPromise;
  }

  private async load(): Promise<void> {
    console.log("[FaBPriceCache] Fetching prices from TCGCSV...");
    const started = Date.now();

    try {
      const groups = await getFaBGroups();
      const newMap = new Map<number, FaBPriceEntry>();

      // Fetch prices for all groups in batches to avoid overwhelming the API
      for (let i = 0; i < groups.length; i += this.BATCH_SIZE) {
        const batch = groups.slice(i, i + this.BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((g) => getFaBPrices(g.groupId))
        );

        for (const result of results) {
          if (result.status !== "fulfilled") continue;

          for (const price of result.value) {
            const id = price.productId;
            const marketPrice = price.marketPrice ?? price.midPrice ?? null;
            const isFoil = /foil/i.test(price.subTypeName);

            const existing = newMap.get(id) ?? { usd: null, usd_foil: null };
            if (isFoil) {
              newMap.set(id, { ...existing, usd_foil: marketPrice });
            } else {
              // "Normal" or any non-foil variant
              newMap.set(id, { ...existing, usd: marketPrice });
            }
          }
        }
      }

      this.priceMap = newMap;
      this.lastFetched = new Date();
      const elapsed = Date.now() - started;
      console.log(
        `[FaBPriceCache] ✓ Loaded prices for ${newMap.size} products across ${groups.length} sets in ${elapsed}ms`
      );
    } catch (err: any) {
      console.error("[FaBPriceCache] ✗ Failed to load prices:", err.message);
      // Keep existing prices if any; don't reset lastFetched so we retry next request
    }
  }

  /**
   * Look up price for a single TCGPlayer product ID.
   * Returns { usd: null, usd_foil: null } if not found.
   */
  getPrice(tcgplayerProductId: string | number | null | undefined): FaBPriceEntry {
    if (!tcgplayerProductId) return { usd: null, usd_foil: null };
    const id =
      typeof tcgplayerProductId === "string"
        ? parseInt(tcgplayerProductId, 10)
        : tcgplayerProductId;
    if (isNaN(id)) return { usd: null, usd_foil: null };
    return this.priceMap.get(id) ?? { usd: null, usd_foil: null };
  }

  /** How many products have prices loaded */
  getStatus() {
    return {
      productCount: this.priceMap.size,
      lastFetched: this.lastFetched,
      isStale: this.isStale(),
    };
  }

  /** Force a full refresh (e.g., from a scheduled job) */
  async refresh(): Promise<void> {
    this.lastFetched = null; // mark stale
    await this.ensureLoaded();
  }
}

export const fabPriceCache = new FaBPriceCache();
