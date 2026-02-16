/**
 * Price Snapshot Mechanism
 *
 * Periodically records price snapshots for all followed cards from multiple sources:
 * - Scryfall (TCGPlayer + CardMarket prices)
 * - TCGTracking (free, condition-specific TCGPlayer prices)
 * - JustTCG (optional, requires API key)
 * - Wisdom Guild (optional, Japanese market, requires API key)
 *
 * Snapshots include exchange rates at time of recording for historical accuracy.
 */

import { storage } from "./storage";
import { getCardById as getScryfallCard } from "./scryfall";
import { searchCardByName as searchTCGTracking, getNearMintPrice } from "./tcgtracking";
import { getCardPrice as getJustTCGPrice } from "./justtcg";
import { searchCardPrice as getWisdomGuildPrice, isConfigured as isWisdomGuildConfigured } from "./wisdom-guild";
import type { InsertPriceHistory } from "@shared/schema";

/**
 * Log helper for price snapshot operations
 */
function log(message: string, level: "info" | "warn" | "error" = "info") {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [PriceSnapshot]`;

  if (level === "error") {
    console.error(`${prefix} ❌ ${message}`);
  } else if (level === "warn") {
    console.warn(`${prefix} ⚠️  ${message}`);
  } else {
    console.log(`${prefix} ✓ ${message}`);
  }
}

/**
 * Get exchange rates from settings
 */
async function getExchangeRates(): Promise<{ usdToCny: number; usdToJpy: number }> {
  const cnySetting = await storage.getSetting("usd_to_cny");
  const jpySetting = await storage.getSetting("usd_to_jpy");

  return {
    usdToCny: cnySetting ? parseFloat(cnySetting.value) : 7.25,
    usdToJpy: jpySetting ? parseFloat(jpySetting.value) : 150,
  };
}

/**
 * Check if a snapshot already exists for today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Record a price snapshot from Scryfall (primary source)
 */
async function snapshotFromScryfall(
  scryfallId: string,
  cardName: string,
  exchangeRates: { usdToCny: number; usdToJpy: number }
): Promise<void> {
  try {
    const card = await getScryfallCard(scryfallId);

    const usd = card.prices.usd ? parseFloat(card.prices.usd) : null;
    const usdFoil = card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null;
    const eur = card.prices.eur ? parseFloat(card.prices.eur) : null;
    const tix = card.prices.tix ? parseFloat(card.prices.tix) : null;

    await storage.addPriceSnapshot({
      scryfallId,
      source: "scryfall",
      condition: "NM",
      priceUsd: usd,
      priceUsdFoil: usdFoil,
      priceEur: eur,
      priceTix: tix,
      priceCny: null,  // No direct CNY source yet
      priceJpy: null,  // No direct JPY source yet
      exchangeRateUsdCny: exchangeRates.usdToCny,
      exchangeRateUsdJpy: exchangeRates.usdToJpy,
    });

    log(`Scryfall snapshot recorded: ${cardName} (${scryfallId}) - $${usd || "N/A"}`);
  } catch (error: any) {
    log(`Scryfall snapshot failed for ${cardName}: ${error.message}`, "error");
  }
}

/**
 * Record a price snapshot from TCGTracking (free, condition-specific)
 */
async function snapshotFromTCGTracking(
  scryfallId: string,
  cardName: string,
  exchangeRates: { usdToCny: number; usdToJpy: number }
): Promise<void> {
  try {
    const results = await searchTCGTracking(cardName);

    if (results.length === 0) {
      log(`TCGTracking: No results for ${cardName}`, "warn");
      return;
    }

    // Take the first match (most relevant)
    const card = results[0];
    const priceUsd = getNearMintPrice(card, false);
    const priceUsdFoil = getNearMintPrice(card, true);

    if (!priceUsd && !priceUsdFoil) {
      log(`TCGTracking: No pricing available for ${cardName}`, "warn");
      return;
    }

    await storage.addPriceSnapshot({
      scryfallId,
      source: "tcgtracking",
      condition: "NM",
      priceUsd,
      priceUsdFoil,
      priceEur: null,
      priceTix: null,
      priceCny: null,
      priceJpy: null,
      exchangeRateUsdCny: exchangeRates.usdToCny,
      exchangeRateUsdJpy: exchangeRates.usdToJpy,
    });

    log(`TCGTracking snapshot recorded: ${cardName} - $${priceUsd || "N/A"}`);
  } catch (error: any) {
    log(`TCGTracking snapshot failed for ${cardName}: ${error.message}`, "error");
  }
}

/**
 * Record a price snapshot from Wisdom Guild (Japanese market, optional)
 */
async function snapshotFromWisdomGuild(
  scryfallId: string,
  cardName: string,
  exchangeRates: { usdToCny: number; usdToJpy: number }
): Promise<void> {
  if (!isWisdomGuildConfigured()) {
    return; // Silently skip if not configured
  }

  try {
    const card = await getWisdomGuildPrice(cardName);

    if (!card || !card.priceJpy) {
      return; // No price found
    }

    await storage.addPriceSnapshot({
      scryfallId,
      source: "wisdomguild",
      condition: "NM",
      priceUsd: null,
      priceUsdFoil: null,
      priceEur: null,
      priceTix: null,
      priceCny: null,
      priceJpy: card.priceJpy,  // Direct JPY price!
      exchangeRateUsdCny: exchangeRates.usdToCny,
      exchangeRateUsdJpy: exchangeRates.usdToJpy,
    });

    log(`Wisdom Guild snapshot recorded: ${cardName} - ¥${card.priceJpy}`);
  } catch (error: any) {
    log(`Wisdom Guild snapshot failed for ${cardName}: ${error.message}`, "error");
  }
}

/**
 * Record a price snapshot from JustTCG (optional, requires API key)
 */
async function snapshotFromJustTCG(
  scryfallId: string,
  cardName: string,
  exchangeRates: { usdToCny: number; usdToJpy: number }
): Promise<void> {
  const apiKey = process.env.JUSTTCG_API_KEY;
  if (!apiKey) return; // Silently skip if not configured

  try {
    // JustTCG uses TCGPlayer IDs, but we search by name for now
    const { searchCardByName } = await import("./tcgtracking");
    const results = await searchCardByName(cardName);

    if (results.length === 0) return;

    const card = results[0];
    // Try to get a TCGPlayer ID from the result if available
    const tcgplayerId = (card as any).tcgplayerId || (card as any).id;

    if (!tcgplayerId) return;

    const justTCGCard = await getJustTCGPrice(tcgplayerId);

    if (!justTCGCard || !justTCGCard.price) return;

    await storage.addPriceSnapshot({
      scryfallId,
      source: "justtcg",
      condition: justTCGCard.condition || "NM",
      priceUsd: justTCGCard.price,
      priceUsdFoil: null,
      priceEur: null,
      priceTix: null,
      priceCny: null,
      priceJpy: null,
      exchangeRateUsdCny: exchangeRates.usdToCny,
      exchangeRateUsdJpy: exchangeRates.usdToJpy,
    });

    log(`JustTCG snapshot recorded: ${cardName} - $${justTCGCard.price}`);
  } catch (error: any) {
    log(`JustTCG snapshot failed for ${cardName}: ${error.message}`, "error");
  }
}

/**
 * Snapshot all followed cards from all available sources
 */
export async function snapshotFollowedCardPrices(): Promise<void> {
  log("Starting price snapshot job...", "info");

  try {
    const followedCards = await storage.getFollowedCards();

    if (followedCards.length === 0) {
      log("No followed cards to snapshot", "info");
      return;
    }

    log(`Found ${followedCards.length} followed cards`, "info");

    const exchangeRates = await getExchangeRates();
    log(`Exchange rates: 1 USD = ${exchangeRates.usdToCny} CNY, ${exchangeRates.usdToJpy} JPY`, "info");

    let snapshotCount = 0;
    let skipCount = 0;

    for (const followedCard of followedCards) {
      try {
        // Check if Scryfall snapshot already exists today
        const latestScryfall = await storage.getLatestPriceSnapshot(followedCard.scryfallId, "scryfall");

        if (latestScryfall && isToday(new Date(latestScryfall.recordedAt))) {
          log(`Skipping ${followedCard.cardName} - already snapshotted today (Scryfall)`, "info");
          skipCount++;
          continue;
        }

        // Record snapshots from all sources
        await snapshotFromScryfall(followedCard.scryfallId, followedCard.cardName, exchangeRates);
        await snapshotFromTCGTracking(followedCard.scryfallId, followedCard.cardName, exchangeRates);
        await snapshotFromJustTCG(followedCard.scryfallId, followedCard.cardName, exchangeRates);
        await snapshotFromWisdomGuild(followedCard.scryfallId, followedCard.cardName, exchangeRates);

        snapshotCount++;

        // Small delay to avoid overwhelming APIs (100ms between cards)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        log(`Failed to snapshot ${followedCard.cardName}: ${error.message}`, "error");
      }
    }

    log(`Price snapshot job completed: ${snapshotCount} cards snapshotted, ${skipCount} skipped`, "info");
  } catch (error: any) {
    log(`Price snapshot job failed: ${error.message}`, "error");
  }
}

/**
 * Snapshot a single card immediately (used when user follows a card)
 */
export async function snapshotSingleCard(scryfallId: string, cardName: string): Promise<void> {
  log(`Taking immediate snapshot for ${cardName} (${scryfallId})`, "info");

  const exchangeRates = await getExchangeRates();

  await Promise.all([
    snapshotFromScryfall(scryfallId, cardName, exchangeRates),
    snapshotFromTCGTracking(scryfallId, cardName, exchangeRates),
    snapshotFromJustTCG(scryfallId, cardName, exchangeRates),
    snapshotFromWisdomGuild(scryfallId, cardName, exchangeRates),
  ]);
}
