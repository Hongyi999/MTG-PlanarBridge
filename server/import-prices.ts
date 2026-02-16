import { db } from "./db";
import { cards } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

const TCGTRACKING_BASE = "https://tcgtracking.com/tcgapi/v1";

export async function updateMTGPricesFromTCGTracking(): Promise<{ updated: number }> {
  console.log("[Price Update] Fetching MTG sets from TCGTracking...");

  try {
    const setsRes = await fetch(`${TCGTRACKING_BASE}/1/sets`, {
      headers: { "User-Agent": "MTGHub/1.0" },
    });
    const setsData = await setsRes.json() as { sets: Array<{ id: number; name: string }> };
    const sets = setsData.sets || [];
    console.log(`[Price Update] Found ${sets.length} MTG sets`);

    let totalUpdated = 0;
    const recentSets = sets.slice(-50);

    for (const set of recentSets) {
      try {
        const [productsRes, pricingRes] = await Promise.all([
          fetch(`${TCGTRACKING_BASE}/1/sets/${set.id}`).then(r => r.json()),
          fetch(`${TCGTRACKING_BASE}/1/sets/${set.id}/pricing`).then(r => r.json()),
        ]);

        const products = productsRes.products || [];
        const prices = pricingRes.prices || {};

        for (const product of products) {
          const scryfallId = product.scryfall_id;
          if (!scryfallId) continue;

          const priceData = prices[product.id];
          if (!priceData) continue;

          const tcgMarketPrice = priceData?.tcg?.market;
          if (tcgMarketPrice === undefined) continue;

          await db.update(cards)
            .set({
              prices: sql`jsonb_set(
                COALESCE(prices, '{}'::jsonb),
                '{tcgtracking_usd}',
                ${tcgMarketPrice}::text::jsonb
              )`,
              updatedAt: new Date(),
            })
            .where(and(
              eq(cards.externalId, scryfallId),
              eq(cards.game, "mtg"),
            ));

          totalUpdated++;
        }

        console.log(`[Price Update] Set "${set.name}" processed: ${products.length} products`);

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err: any) {
        console.warn(`[Price Update] Error processing set ${set.name}:`, err.message);
      }
    }

    console.log(`[Price Update] Complete! Updated ${totalUpdated} card prices.`);
    return { updated: totalUpdated };
  } catch (error: any) {
    console.error("[Price Update] Error:", error);
    throw error;
  }
}

if (process.argv[1]?.includes("import-prices")) {
  updateMTGPricesFromTCGTracking()
    .then(result => {
      console.log(`Done: ${result.updated} prices updated`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
