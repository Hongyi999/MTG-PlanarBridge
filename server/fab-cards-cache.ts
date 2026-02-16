/**
 * In-memory cache for the-fab-cube/flesh-and-blood-cards data
 * Provides fast lookups without external API calls or rate limits
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { FaBCardData, FaBSet, FaBKeyword } from "./fab-cards-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "fab-cards-data", "json", "english");
const CARD_FILE = path.join(DATA_PATH, "card.json");
const SET_FILE = path.join(DATA_PATH, "set.json");
const KEYWORD_FILE = path.join(DATA_PATH, "keyword.json");

interface CacheState {
  cards: FaBCardData[];
  cardsByUUID: Map<string, FaBCardData>;
  cardsByName: Map<string, FaBCardData>;
  cardsByIdentifier: Map<string, FaBCardData>; // "MST131" -> card
  sets: FaBSet[];
  keywords: FaBKeyword[];
  lastUpdated: Date | null;
  isLoaded: boolean;
}

class FaBCardsCache {
  private cache: CacheState = {
    cards: [],
    cardsByUUID: new Map(),
    cardsByName: new Map(),
    cardsByIdentifier: new Map(),
    sets: [],
    keywords: [],
    lastUpdated: null,
    isLoaded: false,
  };

  /**
   * Load all card data into memory
   */
  async load(): Promise<void> {
    console.log("[FaBCardsCache] Loading card data...");
    const startTime = Date.now();

    try {
      // Load cards
      const cardsData = JSON.parse(fs.readFileSync(CARD_FILE, "utf-8")) as FaBCardData[];
      this.cache.cards = cardsData;

      // Build indexes
      this.cache.cardsByUUID.clear();
      this.cache.cardsByName.clear();
      this.cache.cardsByIdentifier.clear();

      for (const card of cardsData) {
        // Index by UUID
        this.cache.cardsByUUID.set(card.unique_id, card);

        // Index by name (lowercase for case-insensitive search)
        this.cache.cardsByName.set(card.name.toLowerCase(), card);

        // Index by all printing identifiers (e.g., "MST131", "ARC000")
        for (const printing of card.printings) {
          this.cache.cardsByIdentifier.set(printing.id, card);
        }
      }

      // Load sets
      const setsData = JSON.parse(fs.readFileSync(SET_FILE, "utf-8")) as FaBSet[];
      this.cache.sets = setsData;

      // Load keywords
      const keywordsData = JSON.parse(fs.readFileSync(KEYWORD_FILE, "utf-8")) as FaBKeyword[];
      this.cache.keywords = keywordsData;

      this.cache.lastUpdated = new Date();
      this.cache.isLoaded = true;

      const duration = Date.now() - startTime;
      console.log(`[FaBCardsCache] ✓ Loaded ${cardsData.length} cards in ${duration}ms`);
    } catch (error) {
      console.error("[FaBCardsCache] ✗ Failed to load data:", error);
      throw error;
    }
  }

  /**
   * Ensure cache is loaded (lazy loading)
   */
  private ensureLoaded(): void {
    if (!this.cache.isLoaded) {
      throw new Error("FaBCardsCache not loaded. Call .load() first.");
    }
  }

  /**
   * Search cards by keyword (case-insensitive)
   */
  searchCards(query: string, page: number = 1, perPage: number = 20): {
    data: FaBCardData[];
    current_page: number;
    last_page: number;
    total: number;
  } {
    this.ensureLoaded();
    const lowerQuery = query.toLowerCase().trim();

    // Filter cards by name match
    const matches = this.cache.cards.filter(card =>
      card.name.toLowerCase().includes(lowerQuery)
    );

    // Paginate
    const total = matches.length;
    const lastPage = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;
    const data = matches.slice(offset, offset + perPage);

    return {
      data,
      current_page: page,
      last_page: lastPage,
      total,
    };
  }

  /**
   * Get a single card by identifier (e.g., "MST131", "ARC000")
   */
  getCardByIdentifier(identifier: string): FaBCardData | null {
    this.ensureLoaded();
    return this.cache.cardsByIdentifier.get(identifier) || null;
  }

  /**
   * Get a single card by UUID
   */
  getCardByUUID(uuid: string): FaBCardData | null {
    this.ensureLoaded();
    return this.cache.cardsByUUID.get(uuid) || null;
  }

  /**
   * Get a single card by exact name (case-insensitive)
   */
  getCardByName(name: string): FaBCardData | null {
    this.ensureLoaded();
    return this.cache.cardsByName.get(name.toLowerCase()) || null;
  }

  /**
   * Get all sets
   */
  getSets(): FaBSet[] {
    this.ensureLoaded();
    return this.cache.sets;
  }

  /**
   * Get all keywords
   */
  getKeywords(): FaBKeyword[] {
    this.ensureLoaded();
    return this.cache.keywords;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      isLoaded: this.cache.isLoaded,
      totalCards: this.cache.cards.length,
      totalSets: this.cache.sets.length,
      totalKeywords: this.cache.keywords.length,
      lastUpdated: this.cache.lastUpdated,
    };
  }

  /**
   * Reload data from disk (for scheduled updates)
   */
  async reload(): Promise<void> {
    console.log("[FaBCardsCache] Reloading data...");
    this.cache.isLoaded = false;
    await this.load();
  }
}

// Singleton instance
export const fabCardsCache = new FaBCardsCache();
