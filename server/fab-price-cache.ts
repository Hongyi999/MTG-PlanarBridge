/**
 * FAB Price Cache - Fetches and caches TCGPlayer prices for Flesh and Blood cards
 *
 * Uses the TCGCSV API (free, no key required) which mirrors TCGPlayer data.
 * Prices are keyed by tcgplayer_product_id and refreshed every 24 hours.
 *
 * Fallback: if TCGCSV is unreachable, loads from server/fab-prices-local.json
 * (auto-saved whenever a successful TCGCSV fetch completes).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getFaBGroups, getFaBPrices } from "./tcgcsv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_PRICE_FILE = path.join(__dirname, "fab-prices-local.json");

export interface FaBPriceEntry {
  usd: number | null;       // Normal / market price
  usd_foil: number | null;  // Foil market price (Rainbow Foil, Cold Foil, etc.)
}

interface LocalPriceFile {
  lastUpdated: string;
  source: "tcgcsv" | "manual";
  prices: Record<string, { usd: number | null; usd_foil: number | null }>;
}

class FaBPriceCache {
  private priceMap: Map<number, FaBPriceEntry> = new Map();
  private lastFetched: Date | null = null;
  private loadPromise: Promise<void> | null = null;
  private loadedFromLocal = false;

  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
      const BATCH_SIZE = 5;
      for (let i = 0; i < groups.length; i += BATCH_SIZE) {
        const batch = groups.slice(i, i + BATCH_SIZE);
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
              newMap.set(id, { ...existing, usd: marketPrice });
            }
          }
        }
      }

      this.priceMap = newMap;
      this.lastFetched = new Date();
      this.loadedFromLocal = false;
      const elapsed = Date.now() - started;
      console.log(
        `[FaBPriceCache] ✓ Loaded prices for ${newMap.size} products across ${groups.length} sets in ${elapsed}ms`
      );

      // Persist to local file for offline fallback
      this.saveToLocalFile();
    } catch (err: any) {
      console.warn(`[FaBPriceCache] TCGCSV unreachable: ${err.message}`);
      // Try loading from local file as fallback
      await this.loadFromLocalFile();
    }
  }

  /** Save current price map to a local JSON file for offline use */
  private saveToLocalFile(): void {
    try {
      const prices: Record<string, { usd: number | null; usd_foil: number | null }> = {};
      for (const [id, entry] of this.priceMap) {
        prices[String(id)] = entry;
      }
      const data: LocalPriceFile = {
        lastUpdated: new Date().toISOString(),
        source: "tcgcsv",
        prices,
      };
      fs.writeFileSync(LOCAL_PRICE_FILE, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[FaBPriceCache] ✓ Saved ${this.priceMap.size} prices to local file`);
    } catch (err: any) {
      console.warn(`[FaBPriceCache] Could not save local price file: ${err.message}`);
    }
  }

  /** Load prices from local fallback file */
  private async loadFromLocalFile(): Promise<void> {
    if (!fs.existsSync(LOCAL_PRICE_FILE)) {
      console.warn("[FaBPriceCache] No local price file found. FAB prices will show as N/A.");
      // Mark as "loaded" with empty map so we don't keep retrying on every request
      this.lastFetched = new Date(Date.now() - this.CACHE_TTL_MS + 5 * 60 * 1000); // retry in 5 min
      return;
    }

    try {
      const raw = fs.readFileSync(LOCAL_PRICE_FILE, "utf-8");
      const data: LocalPriceFile = JSON.parse(raw);
      const newMap = new Map<number, FaBPriceEntry>();
      for (const [idStr, entry] of Object.entries(data.prices)) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) newMap.set(id, entry);
      }
      this.priceMap = newMap;
      this.lastFetched = new Date(); // treat as fresh to avoid hammering
      this.loadedFromLocal = true;
      console.log(
        `[FaBPriceCache] ✓ Loaded ${newMap.size} prices from local file (last updated: ${data.lastUpdated})`
      );
    } catch (err: any) {
      console.error(`[FaBPriceCache] Failed to load local price file: ${err.message}`);
      this.lastFetched = new Date(Date.now() - this.CACHE_TTL_MS + 5 * 60 * 1000);
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
      loadedFromLocal: this.loadedFromLocal,
    };
  }

  /** Force a full refresh (e.g., from a scheduled job) */
  async refresh(): Promise<void> {
    this.lastFetched = null; // mark stale
    await this.ensureLoaded();
  }
}

export const fabPriceCache = new FaBPriceCache();
