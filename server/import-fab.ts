import { db } from "./db";
import { cards, importJobs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const FAB_CARDS_URL = "https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/develop/json/english/card.json";
const FABDB_API_URL = "https://fabdb.net/api/cards";
const BATCH_SIZE = 500;

interface FabCubeCard {
  unique_id: string;
  name: string;
  pitch?: string;
  cost?: string;
  power?: string;
  defense?: string;
  health?: string;
  intelligence?: string;
  types?: string[];
  card_keywords?: string[];
  abilities_and_effects?: string[];
  ability_and_effect_keywords?: string[];
  granted_keywords?: string[];
  functional_text?: string;
  functional_text_plain?: string;
  type_text?: string;
  played_horizontally?: boolean;
  blitz_legal?: boolean;
  cc_legal?: boolean;
  commoner_legal?: boolean;
  blitz_living_legend?: boolean;
  cc_living_legend?: boolean;
  blitz_banned?: boolean;
  cc_banned?: boolean;
  commoner_banned?: boolean;
  upf_banned?: boolean;
  ll_restricted?: boolean;
  printings?: Array<{
    unique_id: string;
    set_printing_unique_id: string;
    id: string;
    set_id: string;
    edition: string;
    foilings: string[];
    rarity: string;
    artist: string;
    art_variation?: string;
    flavor_text?: string;
    flavor_text_plain?: string;
    image_url?: string;
    tcgplayer_product_id?: string;
    tcgplayer_url?: string;
  }>;
}

function parseNumeric(val?: string): number | undefined {
  if (!val || val === "*") return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}

function getFirstPrinting(card: FabCubeCard) {
  if (!card.printings || card.printings.length === 0) return null;
  return card.printings[0];
}

function getImageUrl(card: FabCubeCard): string | null {
  const printing = getFirstPrinting(card);
  if (printing?.image_url) return printing.image_url;
  if (printing?.id) {
    return `https://fabdb2.imgix.net/cards/printings/${printing.id}.png?w=400`;
  }
  return null;
}

export async function importFABCards(onProgress?: (imported: number, total: number) => void): Promise<{ imported: number; total: number }> {
  console.log("[FAB Import] Starting FAB cards import from GitHub repo...");

  const [job] = await db.insert(importJobs).values({
    source: "fab-cube-github",
    game: "fab",
    status: "running",
  }).returning();

  try {
    console.log("[FAB Import] Fetching card data from GitHub...");
    const res = await fetch(FAB_CARDS_URL, {
      headers: { "User-Agent": "MTGHub/1.0" },
    });
    const allCards = await res.json() as FabCubeCard[];
    console.log(`[FAB Import] Total FAB cards fetched: ${allCards.length}`);

    await db.update(importJobs).set({ totalCards: allCards.length }).where(eq(importJobs.id, job.id));

    let imported = 0;
    for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
      const batch = allCards.slice(i, i + BATCH_SIZE);
      const values = batch.map(c => {
        const printing = getFirstPrinting(c);
        return {
          game: "fab" as const,
          externalId: c.unique_id,
          name_en: c.name,
          name_cn: null,
          image_uri: getImageUrl(c),
          set_code: printing?.set_id || null,
          set_name: null,
          collector_number: printing?.id || null,
          rarity: printing?.rarity || null,
          type_line: c.type_text || (c.types?.join(" ") || null),
          prices: {},
          mtgData: null,
          fabData: {
            pitch: parseNumeric(c.pitch),
            cost: parseNumeric(c.cost),
            power: parseNumeric(c.power),
            defense: parseNumeric(c.defense),
            health: parseNumeric(c.health),
            intelligence: parseNumeric(c.intelligence),
            types: c.types,
            keywords: c.card_keywords,
            abilities: c.abilities_and_effects,
            text: c.functional_text_plain || c.functional_text || undefined,
            unique_id: c.unique_id,
            tcgplayer_id: printing?.tcgplayer_product_id ? parseInt(printing.tcgplayer_product_id, 10) : undefined,
          },
        };
      });

      await db.insert(cards).values(values)
        .onConflictDoUpdate({
          target: [cards.game, cards.externalId],
          set: {
            name_en: sql`excluded.name_en`,
            image_uri: sql`excluded.image_uri`,
            set_code: sql`excluded.set_code`,
            collector_number: sql`excluded.collector_number`,
            rarity: sql`excluded.rarity`,
            type_line: sql`excluded.type_line`,
            fabData: sql`excluded.fab_data`,
            updatedAt: sql`now()`,
          },
        });

      imported += batch.length;
      if (imported % 2000 === 0 || imported === allCards.length) {
        console.log(`[FAB Import] Progress: ${imported}/${allCards.length}`);
        await db.update(importJobs).set({ importedCards: imported }).where(eq(importJobs.id, job.id));
      }
      onProgress?.(imported, allCards.length);
    }

    await db.update(importJobs).set({
      status: "completed",
      importedCards: imported,
      completedAt: new Date(),
    }).where(eq(importJobs.id, job.id));

    console.log(`[FAB Import] Complete! Imported ${imported} cards.`);
    return { imported, total: allCards.length };
  } catch (error: any) {
    console.error("[FAB Import] Error:", error);
    await db.update(importJobs).set({
      status: "failed",
      error: error.message,
      completedAt: new Date(),
    }).where(eq(importJobs.id, job.id));
    throw error;
  }
}

if (process.argv[1]?.includes("import-fab")) {
  importFABCards()
    .then(result => {
      console.log(`Done: ${result.imported} cards imported`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
