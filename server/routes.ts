import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertPriceListSchema, insertPriceListItemSchema, insertFollowedCardSchema, insertCardHistorySchema, insertCommunityPostSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { searchCards, getCardById, getCardByName, autocomplete, type ScryfallCard } from "./scryfall";
import { snapshotFollowedCardPrices, snapshotSingleCard } from "./price-snapshot";
import session from "express-session";
import { fabCardsCache } from "./fab-cards-cache";
import { fabPriceCache } from "./fab-price-cache";
import type { FaBCardData } from "./fab-cards-types";

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

// Extend session to include userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Map fab-cards-cache data to API response format
 * Converts comprehensive fab-cards repository structure to simplified API format.
 * Looks up live TCGPlayer prices from fabPriceCache for each printing.
 */
function mapFaBCardToAPI(
  card: FaBCardData,
  rates: { usd_to_cny: number; usd_to_jpy: number }
) {
  // Get the first printing for image and rarity
  const firstPrinting = card.printings[0];

  // Build per-printing prices and find the best "main" price
  const printingsWithPrices = card.printings.map((p) => {
    const price = fabPriceCache.getPrice(p.tcgplayer_product_id);
    return {
      id: p.id,
      set_id: p.set_id,
      edition: p.edition,
      foiling: p.foiling,
      image: p.image_url,
      rarity: p.rarity,
      tcgplayer_product_id: p.tcgplayer_product_id,
      tcgplayer_url: p.tcgplayer_url,
      prices: {
        usd: price.usd,
        usd_foil: price.usd_foil,
      },
    };
  });

  // Use the first printing's normal price as the card-level headline price
  const headlinePrice = fabPriceCache.getPrice(firstPrinting?.tcgplayer_product_id);
  const usd = headlinePrice.usd;

  return {
    identifier: firstPrinting?.id || card.unique_id.substring(0, 7),
    name: card.name,
    text: card.functional_text_plain || null,
    cost: card.cost || null,
    pitch: card.pitch || null,
    power: card.power || null,
    defense: card.defense || null,
    health: card.health || null,
    rarity: firstPrinting?.rarity || null,
    keywords: card.card_keywords || [],
    image: firstPrinting?.image_url || null,
    printings: printingsWithPrices,
    prices: {
      usd,
      usd_foil: headlinePrice.usd_foil,
      cny_converted: usd !== null ? Math.round(usd * rates.usd_to_cny * 100) / 100 : null,
      jpy_converted: usd !== null ? Math.round(usd * rates.usd_to_jpy * 100) / 100 : null,
    },
  };
}

export async function registerRoutes(
  app: Express
): Promise<void> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "mtg-planar-bridge-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: "lax",
    },
  }));

  // ============ Auth Endpoints ============

  // Send verification code (MVP: generate and return, no real SMS)
  app.post("/api/auth/send-code", async (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "请输入有效的手机号" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await storage.saveVerificationCode(phone, code, expiresAt);

    // MVP: return code directly (production would use SMS service)
    console.log(`[Auth] Verification code for ${phone}: ${code}`);
    res.json({ success: true, message: "验证码已发送", code });
  });

  // Login / Register with verification code
  app.post("/api/auth/login", async (req, res) => {
    const { phone, code, wechatNickname } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: "手机号和验证码不能为空" });
    }

    const valid = await storage.verifyCode(phone, code);
    if (!valid) {
      return res.status(401).json({ message: "验证码错误或已过期" });
    }

    // Check if user exists
    let user = await storage.getUserByPhone(phone);

    if (!user) {
      // Auto-register
      const username = wechatNickname || `用户${phone.slice(-4)}`;
      user = await storage.createUser({
        username,
        phone,
        wechatNickname: wechatNickname || null,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      });
    } else if (wechatNickname && wechatNickname !== user.wechatNickname) {
      user = (await storage.updateUser(user.id, { wechatNickname }))!;
    }

    req.session.userId = user.id;
    res.json({ user: { id: user.id, username: user.username, wechatNickname: user.wechatNickname, avatar: user.avatar, phone: user.phone } });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }
    res.json({ user: { id: user.id, username: user.username, wechatNickname: user.wechatNickname, avatar: user.avatar, phone: user.phone } });
  });

  // Update profile
  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "未登录" });
    const { username, wechatNickname, avatar } = req.body;
    const data: any = {};
    if (username) data.username = username;
    if (wechatNickname !== undefined) data.wechatNickname = wechatNickname;
    if (avatar) data.avatar = avatar;
    const user = await storage.updateUser(req.session.userId, data);
    if (!user) return res.status(404).json({ message: "用户不存在" });
    res.json({ user: { id: user.id, username: user.username, wechatNickname: user.wechatNickname, avatar: user.avatar, phone: user.phone } });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // ============ Message Endpoints ============

  // Get conversations list
  app.get("/api/messages/conversations", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "未登录" });
    const conversations = await storage.getConversations(req.session.userId);
    res.json(conversations.map(c => ({
      user: { id: c.user.id, username: c.user.username, avatar: c.user.avatar, wechatNickname: c.user.wechatNickname },
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
    })));
  });

  // Get messages with a specific user
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "未登录" });
    const otherId = parseInt(req.params.userId);
    const msgs = await storage.getMessages(req.session.userId, otherId);
    // Mark as read
    await storage.markMessagesRead(req.session.userId, otherId);
    res.json(msgs);
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "未登录" });
    const parsed = insertMessageSchema.safeParse({ ...req.body, senderId: req.session.userId });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const msg = await storage.sendMessage(parsed.data);
    res.json(msg);
  });

  // Search users (for starting conversations)
  app.get("/api/users/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.json([]);
    const user = await storage.getUserByUsername(q);
    if (user) {
      res.json([{ id: user.id, username: user.username, avatar: user.avatar, wechatNickname: user.wechatNickname }]);
    } else {
      res.json([]);
    }
  });

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

    // Take an immediate price snapshot for the newly followed card
    snapshotSingleCard(card.scryfallId, card.cardName).catch((err) => {
      console.error(`Failed to snapshot ${card.cardName} on follow:`, err);
    });

    res.json(card);
  });

  app.delete("/api/followed-cards/:id", async (req, res) => {
    await storage.removeFollowedCard(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Price History Endpoints
  app.get("/api/price-history/:scryfallId", async (req, res) => {
    const { scryfallId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 90;
    const history = await storage.getPriceHistory(scryfallId, days);
    res.json(history);
  });

  app.get("/api/price-history/:scryfallId/latest", async (req, res) => {
    const { scryfallId } = req.params;
    const source = req.query.source as string | undefined;
    const snapshot = await storage.getLatestPriceSnapshot(scryfallId, source);
    res.json(snapshot || null);
  });

  app.post("/api/price-history/snapshot", async (_req, res) => {
    try {
      // Manual trigger for price snapshot (admin/debugging)
      await snapshotFollowedCardPrices();
      res.json({ success: true, message: "Price snapshot completed" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
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

  // ============ Flesh and Blood (FAB) Endpoints ============

  // Search FAB cards via in-memory cache
  app.get("/api/fab/cards/search", async (req, res) => {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    try {
      // Ensure prices are loaded (non-blocking if already fresh)
      await fabPriceCache.ensureLoaded();
      const rates = await getExchangeRates();
      const result = fabCardsCache.searchCards(q, page, 20);
      const cards = result.data.map((card) => mapFaBCardToAPI(card, rates));
      res.json({
        cards,
        total_cards: result.total,
        has_more: result.current_page < result.last_page,
        next_page: page + 1,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "FAB search failed" });
    }
  });

  // Get FAB card by identifier (e.g., "MST131", "ARC000")
  app.get("/api/fab/cards/:identifier", async (req, res) => {
    try {
      const card = fabCardsCache.getCardByIdentifier(req.params.identifier);
      if (!card) return res.status(404).json({ message: "Card not found" });
      await fabPriceCache.ensureLoaded();
      const rates = await getExchangeRates();
      res.json(mapFaBCardToAPI(card, rates));
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch FAB card" });
    }
  });

  // FAB price cache status (admin/debug)
  app.get("/api/fab/price-cache/status", (_req, res) => {
    res.json(fabPriceCache.getStatus());
  });

  // Force refresh FAB prices (admin/debug)
  app.post("/api/fab/price-cache/refresh", async (_req, res) => {
    try {
      await fabPriceCache.refresh();
      res.json({ success: true, ...fabPriceCache.getStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}
