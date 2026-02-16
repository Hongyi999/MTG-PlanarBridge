import { db, pool } from "./db";
import { cards, importJobs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const SCRYFALL_BULK_URL = "https://api.scryfall.com/bulk-data/default_cards";
const BATCH_SIZE = 500;

interface ScryfallCard {
  id: string;
  name: string;
  printed_name?: string;
  lang: string;
  image_uris?: { large?: string; normal?: string; small?: string; png?: string };
  card_faces?: Array<{ image_uris?: { large?: string; normal?: string } }>;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  oracle_text?: string;
  power?: string;
  toughness?: string;
  keywords?: string[];
  legalities?: Record<string, string>;
  prices?: { usd?: string; usd_foil?: string };
  tcgplayer_id?: number;
  layout?: string;
}

function getImageUri(card: ScryfallCard): string | null {
  if (card.image_uris?.large) return card.image_uris.large;
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.large) return card.card_faces[0].image_uris.large;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return null;
}

export async function importMTGCards(onProgress?: (imported: number, total: number) => void): Promise<{ imported: number; total: number }> {
  console.log("[MTG Import] Starting Scryfall bulk import...");

  const [job] = await db.insert(importJobs).values({
    source: "scryfall",
    game: "mtg",
    status: "running",
  }).returning();

  try {
    console.log("[MTG Import] Fetching bulk data metadata...");
    const metaRes = await fetch(SCRYFALL_BULK_URL, {
      headers: { "User-Agent": "MTGHub/1.0", "Accept": "application/json" },
    });
    const meta = await metaRes.json() as { download_uri: string };
    console.log(`[MTG Import] Downloading from: ${meta.download_uri}`);

    const dataRes = await fetch(meta.download_uri, {
      headers: { "User-Agent": "MTGHub/1.0" },
    });
    const allCards = await dataRes.json() as ScryfallCard[];

    const englishCards = allCards.filter(c => c.lang === "en");
    console.log(`[MTG Import] Total cards: ${allCards.length}, English cards: ${englishCards.length}`);

    const cnMap = new Map<string, string>();
    for (const c of allCards) {
      if (c.lang === "zhs" && c.printed_name) {
        cnMap.set(c.name, c.printed_name);
      }
    }
    console.log(`[MTG Import] Found ${cnMap.size} Chinese translations`);

    await db.update(importJobs).set({ totalCards: englishCards.length }).where(eq(importJobs.id, job.id));

    let imported = 0;
    for (let i = 0; i < englishCards.length; i += BATCH_SIZE) {
      const batch = englishCards.slice(i, i + BATCH_SIZE);
      const values = batch.map(c => ({
        game: "mtg" as const,
        externalId: c.id,
        name_en: c.name,
        name_cn: cnMap.get(c.name) || null,
        image_uri: getImageUri(c),
        set_code: c.set,
        set_name: c.set_name,
        collector_number: c.collector_number,
        rarity: c.rarity,
        type_line: c.type_line || null,
        prices: {
          usd: c.prices?.usd ? parseFloat(c.prices.usd) : undefined,
          usd_foil: c.prices?.usd_foil ? parseFloat(c.prices.usd_foil) : undefined,
        },
        mtgData: {
          mana_cost: c.mana_cost || undefined,
          cmc: c.cmc,
          colors: c.colors,
          color_identity: c.color_identity,
          oracle_text: c.oracle_text || undefined,
          power: c.power || undefined,
          toughness: c.toughness || undefined,
          keywords: c.keywords,
          legalities: c.legalities,
          scryfall_id: c.id,
          tcgplayer_id: c.tcgplayer_id,
        },
        fabData: null,
      }));

      await db.insert(cards).values(values)
        .onConflictDoUpdate({
          target: [cards.game, cards.externalId],
          set: {
            name_en: sql`excluded.name_en`,
            name_cn: sql`excluded.name_cn`,
            image_uri: sql`excluded.image_uri`,
            set_code: sql`excluded.set_code`,
            set_name: sql`excluded.set_name`,
            collector_number: sql`excluded.collector_number`,
            rarity: sql`excluded.rarity`,
            type_line: sql`excluded.type_line`,
            prices: sql`excluded.prices`,
            mtgData: sql`excluded.mtg_data`,
            updatedAt: sql`now()`,
          },
        });

      imported += batch.length;
      if (imported % 5000 === 0 || imported === englishCards.length) {
        console.log(`[MTG Import] Progress: ${imported}/${englishCards.length}`);
        await db.update(importJobs).set({ importedCards: imported }).where(eq(importJobs.id, job.id));
      }
      onProgress?.(imported, englishCards.length);
    }

    await db.update(importJobs).set({
      status: "completed",
      importedCards: imported,
      completedAt: new Date(),
    }).where(eq(importJobs.id, job.id));

    console.log(`[MTG Import] Complete! Imported ${imported} cards.`);
    return { imported, total: englishCards.length };
  } catch (error: any) {
    console.error("[MTG Import] Error:", error);
    await db.update(importJobs).set({
      status: "failed",
      error: error.message,
      completedAt: new Date(),
    }).where(eq(importJobs.id, job.id));
    throw error;
  }
}

if (process.argv[1]?.includes("import-mtg")) {
  importMTGCards()
    .then(result => {
      console.log(`Done: ${result.imported} cards imported`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
