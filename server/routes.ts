import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertPriceListSchema, insertPriceListItemSchema, insertFollowedCardSchema, insertCardHistorySchema, insertCommunityPostSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { searchCards, getCardById, getCardByName, autocomplete, type ScryfallCard } from "./scryfall";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Default exchange rates
const DEFAULT_RATES = { usd_to_cny: 7.25, usd_to_jpy: 150 };

async function getExchangeRates() {
  const cnySetting = await storage.getSetting("usd_to_cny");
  const jpySetting = await storage.getSetting("usd_to_jpy");
  return {
    usd_to_cny: cnySetting ? parseFloat(cnySetting.value) : DEFAULT_RATES.usd_to_cny,
    usd_to_jpy: jpySetting ? parseFloat(jpySetting.value) : DEFAULT_RATES.usd_to_jpy,
  };
}

function scryfallToCardData(sc: ScryfallCard) {
  return {
    scryfall_id: sc.id,
    name_en: sc.name,
    name_cn: sc.printed_name || null,
    image_uri: sc.image_uris?.normal || sc.image_uris?.large || null,
    image_uri_small: sc.image_uris?.small || null,
    set_code: sc.set,
    set_name: sc.set_name,
    collector_number: sc.collector_number,
    mana_cost: sc.mana_cost || null,
    type_line: sc.type_line,
    type_line_cn: sc.printed_type_line || null,
    oracle_text: sc.oracle_text || null,
    oracle_text_cn: sc.printed_text || null,
    colors: sc.colors || [],
    color_identity: sc.color_identity || [],
    rarity: sc.rarity,
    prices: {
      usd: sc.prices.usd ? parseFloat(sc.prices.usd) : null,
      usd_foil: sc.prices.usd_foil ? parseFloat(sc.prices.usd_foil) : null,
      eur: sc.prices.eur ? parseFloat(sc.prices.eur) : null,
      tix: sc.prices.tix ? parseFloat(sc.prices.tix) : null,
    },
    legalities: sc.legalities || {},
  };
}

export async function registerRoutes(
  app: Express
): Promise<void> {
  app.get("/api/cards", async (_req, res) => {
    const cards = await storage.getCards();
    res.json(cards);
  });

  app.get("/api/cards/:id", async (req, res) => {
    const card = await storage.getCard(parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.get("/api/price-lists", async (_req, res) => {
    const lists = await storage.getPriceLists();
    res.json(lists);
  });

  app.post("/api/price-lists", async (req, res) => {
    const parsed = insertPriceListSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const list = await storage.createPriceList(parsed.data);
    res.json(list);
  });

  app.patch("/api/price-lists/:id", async (req, res) => {
    const parsed = insertPriceListSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const updated = await storage.updatePriceList(parseInt(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "List not found" });
    res.json(updated);
  });

  app.delete("/api/price-lists/:id", async (req, res) => {
    await storage.deletePriceList(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/price-lists/:listId/items", async (req, res) => {
    const items = await storage.getPriceListItems(parseInt(req.params.listId));
    res.json(items);
  });

  app.post("/api/price-lists/:listId/items", async (req, res) => {
    const parsed = insertPriceListItemSchema.safeParse({ ...req.body, listId: parseInt(req.params.listId) });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const item = await storage.addPriceListItem(parsed.data);
    res.json(item);
  });

  app.patch("/api/price-list-items/:id", async (req, res) => {
    const parsed = insertPriceListItemSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const updated = await storage.updatePriceListItem(parseInt(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json(updated);
  });

  app.delete("/api/price-list-items/:id", async (req, res) => {
    await storage.removePriceListItem(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/followed-cards", async (_req, res) => {
    const cards = await storage.getFollowedCards();
    res.json(cards);
  });

  app.post("/api/followed-cards", async (req, res) => {
    const parsed = insertFollowedCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const card = await storage.addFollowedCard(parsed.data);
    res.json(card);
  });

  app.delete("/api/followed-cards/:id", async (req, res) => {
    await storage.removeFollowedCard(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/card-history", async (_req, res) => {
    const history = await storage.getCardHistory();
    res.json(history);
  });

  app.post("/api/card-history", async (req, res) => {
    const parsed = insertCardHistorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const entry = await storage.addCardHistory(parsed.data);
    res.json(entry);
  });

  app.get("/api/settings/:key", async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    if (!setting) return res.json({ key: req.params.key, value: null });
    res.json(setting);
  });

  app.put("/api/settings/:key", async (req, res) => {
    const { value } = req.body;
    if (typeof value !== "string") return res.status(400).json({ message: "value must be a string" });
    const setting = await storage.setSetting(req.params.key, value);
    res.json(setting);
  });

  app.get("/api/community-posts", async (_req, res) => {
    const posts = await storage.getCommunityPosts();
    res.json(posts);
  });

  app.post("/api/community-posts", async (req, res) => {
    const parsed = insertCommunityPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const post = await storage.createCommunityPost(parsed.data);
    res.json(post);
  });

  app.post("/api/community-posts/:id/like", async (req, res) => {
    const post = await storage.likeCommunityPost(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  const multer = (await import("multer")).default;
  const uploadMiddleware = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req: any, file: any, cb: any) => {
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only image files allowed"));
    },
  });

  app.post("/api/upload", uploadMiddleware.array("images", 9), (req: any, res: Response) => {
    const files = req.files as any[];
    if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });
    const urls = files.map((f: any) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  const express = (await import("express")).default;
  app.use("/uploads", express.static(uploadDir));

  // ============ Scryfall Proxy Endpoints ============

  // Search cards via Scryfall
  app.get("/api/cards/search", async (req, res) => {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    try {
      const result = await searchCards(q, page);
      const rates = await getExchangeRates();
      const cards = result.data.map((sc: ScryfallCard) => {
        const cardData = scryfallToCardData(sc);
        const usd = cardData.prices.usd;
        return {
          ...cardData,
          prices: {
            ...cardData.prices,
            cny_converted: usd !== null ? Math.round(usd * rates.usd_to_cny * 100) / 100 : null,
            jpy_converted: usd !== null ? Math.round(usd * rates.usd_to_jpy * 100) / 100 : null,
          },
        };
      });
      // Cache cards in the background
      for (const card of cards) {
        storage.upsertCard(card).catch(() => {});
      }
      res.json({
        cards,
        total_cards: result.total_cards,
        has_more: result.has_more,
        next_page: page + 1,
      });
    } catch (err: any) {
      const status = err.status || 500;
      res.status(status).json({ message: err.message || "Search failed" });
    }
  });

  // Autocomplete card names
  app.get("/api/cards/autocomplete", async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.json({ data: [] });
    }
    try {
      const result = await autocomplete(q);
      res.json({ data: result });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Autocomplete failed" });
    }
  });

  // Get card by Scryfall ID
  app.get("/api/cards/scryfall/:scryfallId", async (req, res) => {
    const scryfallId = req.params.scryfallId;
    try {
      // Check cache first
      const cached = await storage.getCardByScryfallId(scryfallId);
      if (cached && cached.cached_at) {
        const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          const rates = await getExchangeRates();
          const usd = cached.prices?.usd ?? null;
          return res.json({
            ...cached,
            prices: {
              ...cached.prices,
              cny_converted: usd !== null ? Math.round(usd * rates.usd_to_cny * 100) / 100 : null,
              jpy_converted: usd !== null ? Math.round(usd * rates.usd_to_jpy * 100) / 100 : null,
            },
          });
        }
      }
      // Fetch from Scryfall
      const sc = await getCardById(scryfallId);
      const cardData = scryfallToCardData(sc);
      const saved = await storage.upsertCard(cardData);
      const rates = await getExchangeRates();
      const usd = cardData.prices.usd;
      res.json({
        ...saved,
        prices: {
          ...saved.prices,
          cny_converted: usd !== null ? Math.round(usd * rates.usd_to_cny * 100) / 100 : null,
          jpy_converted: usd !== null ? Math.round(usd * rates.usd_to_jpy * 100) / 100 : null,
        },
      });
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.status(500).json({ message: err.message || "Failed to fetch card" });
    }
  });

  // Get card by name
  app.get("/api/cards/named", async (req, res) => {
    const name = req.query.name as string;
    const exact = req.query.exact === "true";
    if (!name) {
      return res.status(400).json({ message: "Query parameter 'name' is required" });
    }
    try {
      const sc = await getCardByName(name, exact);
      const cardData = scryfallToCardData(sc);
      const saved = await storage.upsertCard(cardData);
      const rates = await getExchangeRates();
      const usd = cardData.prices.usd;
      res.json({
        ...saved,
        prices: {
          ...saved.prices,
          cny_converted: usd !== null ? Math.round(usd * rates.usd_to_cny * 100) / 100 : null,
          jpy_converted: usd !== null ? Math.round(usd * rates.usd_to_jpy * 100) / 100 : null,
        },
      });
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message || "Failed to fetch card" });
    }
  });

  // Exchange rates
  app.get("/api/exchange-rates", async (_req, res) => {
    const rates = await getExchangeRates();
    res.json(rates);
  });

  app.put("/api/exchange-rates", async (req, res) => {
    const { usd_to_cny, usd_to_jpy } = req.body;
    if (usd_to_cny !== undefined) {
      await storage.setSetting("usd_to_cny", String(usd_to_cny));
    }
    if (usd_to_jpy !== undefined) {
      await storage.setSetting("usd_to_jpy", String(usd_to_jpy));
    }
    const rates = await getExchangeRates();
    res.json(rates);
  });
}
