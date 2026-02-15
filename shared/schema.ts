import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  dci_number: text("dci_number"),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  scryfall_id: text("scryfall_id").notNull().unique(),
  name_en: text("name_en").notNull(),
  name_cn: text("name_cn"),
  image_uri: text("image_uri"),
  image_uri_small: text("image_uri_small"),
  set_code: text("set_code"),
  set_name: text("set_name"),
  collector_number: text("collector_number"),
  mana_cost: text("mana_cost"),
  type_line: text("type_line"),
  type_line_cn: text("type_line_cn"),
  oracle_text: text("oracle_text"),
  oracle_text_cn: text("oracle_text_cn"),
  colors: text("colors").array(),
  color_identity: text("color_identity").array(),
  rarity: text("rarity"),
  prices: jsonb("prices").$type<{
    usd?: number | null;
    usd_foil?: number | null;
    eur?: number | null;
    tix?: number | null;
  }>(),
  legalities: jsonb("legalities").$type<Record<string, string>>(),
  cached_at: timestamp("cached_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["discussion", "sell", "buy", "trade"] }).notNull().default("discussion"),
  cardId: integer("card_id").references(() => cards.id),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  isWishlist: boolean("is_wishlist").default(false).notNull(),
  count: integer("count").default(1).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true, cached_at: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, likes: true, comments: true });
export const priceLists = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceListItems = pgTable("price_list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => priceLists.id).notNull(),
  scryfallId: text("scryfall_id").notNull(),
  cardName: text("card_name").notNull(),
  cardNameCn: text("card_name_cn"),
  cardImage: text("card_image"),
  cardSetCode: text("card_set_code"),
  quantity: integer("quantity").default(1).notNull(),
  condition: text("condition").default("NM"),
  notes: text("notes"),
  priceUsd: real("price_usd"),
  priceCny: real("price_cny"),
  priceJpy: real("price_jpy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followedCards = pgTable("followed_cards", {
  id: serial("id").primaryKey(),
  scryfallId: text("scryfall_id").notNull(),
  cardName: text("card_name").notNull(),
  cardNameCn: text("card_name_cn"),
  cardImage: text("card_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cardHistory = pgTable("card_history", {
  id: serial("id").primaryKey(),
  scryfallId: text("scryfall_id").notNull(),
  cardName: text("card_name").notNull(),
  cardNameCn: text("card_name_cn"),
  cardImage: text("card_image"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  authorAvatar: text("author_avatar"),
  content: text("content").notNull(),
  type: text("type", { enum: ["discussion", "sell", "buy", "trade"] }).notNull().default("discussion"),
  images: text("images").array(),
  scryfallId: text("scryfall_id"),
  cardName: text("card_name"),
  cardImage: text("card_image"),
  price: real("price"),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  scryfallId: text("scryfall_id").notNull(),
  source: text("source", {
    enum: ["scryfall", "tcgtracking", "justtcg", "cardmarket", "wisdomguild", "manual"]
  }).notNull().default("scryfall"),
  condition: text("condition").default("NM"), // NM, LP, MP, HP, DMG for TCGTracking
  priceUsd: real("price_usd"),
  priceUsdFoil: real("price_usd_foil"),
  priceEur: real("price_eur"),
  priceTix: real("price_tix"),
  priceCny: real("price_cny"),              // Direct CNY price (future: from Chinese sources)
  priceJpy: real("price_jpy"),              // Direct JPY price (future: from Wisdom Guild)
  exchangeRateUsdCny: real("exchange_rate_usd_cny"),  // Rate at time of snapshot
  exchangeRateUsdJpy: real("exchange_rate_usd_jpy"),  // Rate at time of snapshot
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, likes: true, comments: true });
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true, recordedAt: true });

export const insertUserCardSchema = createInsertSchema(userCards).omit({ id: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true });
export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({ id: true, createdAt: true });
export const insertFollowedCardSchema = createInsertSchema(followedCards).omit({ id: true, createdAt: true });
export const insertCardHistorySchema = createInsertSchema(cardHistory).omit({ id: true, viewedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type UserCard = typeof userCards.$inferSelect;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type PriceListItem = typeof priceListItems.$inferSelect;
export type InsertPriceListItem = z.infer<typeof insertPriceListItemSchema>;
export type FollowedCard = typeof followedCards.$inferSelect;
export type InsertFollowedCard = z.infer<typeof insertFollowedCardSchema>;
export type CardHistory = typeof cardHistory.$inferSelect;
export type InsertCardHistory = z.infer<typeof insertCardHistorySchema>;
export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = z.infer<typeof insertUserSettingsSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
