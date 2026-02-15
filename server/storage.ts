import {
  users, cards, posts, userCards, priceLists, priceListItems, followedCards, cardHistory, userSettings, communityPosts, priceHistory,
  type User, type InsertUser, type Card, type InsertCard, type Post, type InsertPost,
  type UserCard, type InsertUserCard,
  type PriceList, type InsertPriceList, type PriceListItem, type InsertPriceListItem,
  type FollowedCard, type InsertFollowedCard, type CardHistory, type InsertCardHistory,
  type UserSetting, type CommunityPost, type InsertCommunityPost,
  type PriceHistory, type InsertPriceHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  getCardByScryfallId(scryfallId: string): Promise<Card | undefined>;
  upsertCard(cardData: Partial<InsertCard> & { scryfall_id: string; name_en: string }): Promise<Card>;
  searchCardsCached(query: string): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  getPosts(): Promise<(Post & { user: User; card?: Card })[]>;
  createPost(post: InsertPost): Promise<Post>;
  getUserCards(userId: number): Promise<(UserCard & { card: Card })[]>;
  addUserCard(userCard: InsertUserCard): Promise<UserCard>;

  getPriceLists(): Promise<PriceList[]>;
  getPriceList(id: number): Promise<PriceList | undefined>;
  createPriceList(list: InsertPriceList): Promise<PriceList>;
  updatePriceList(id: number, data: Partial<InsertPriceList>): Promise<PriceList | undefined>;
  deletePriceList(id: number): Promise<void>;

  getPriceListItems(listId: number): Promise<PriceListItem[]>;
  addPriceListItem(item: InsertPriceListItem): Promise<PriceListItem>;
  updatePriceListItem(id: number, data: Partial<InsertPriceListItem>): Promise<PriceListItem | undefined>;
  removePriceListItem(id: number): Promise<void>;

  getFollowedCards(): Promise<FollowedCard[]>;
  addFollowedCard(card: InsertFollowedCard): Promise<FollowedCard>;
  removeFollowedCard(id: number): Promise<void>;

  getCardHistory(): Promise<CardHistory[]>;
  addCardHistory(entry: InsertCardHistory): Promise<CardHistory>;

  getSetting(key: string): Promise<UserSetting | undefined>;
  setSetting(key: string, value: string): Promise<UserSetting>;

  getCommunityPosts(): Promise<CommunityPost[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  likeCommunityPost(id: number): Promise<CommunityPost | undefined>;

  addPriceSnapshot(entry: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(scryfallId: string, days?: number): Promise<PriceHistory[]>;
  getLatestPriceSnapshot(scryfallId: string, source?: string): Promise<PriceHistory | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCards(): Promise<Card[]> {
    return await db.select().from(cards);
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async getCardByScryfallId(scryfallId: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.scryfall_id, scryfallId));
    return card;
  }

  async upsertCard(cardData: Partial<InsertCard> & { scryfall_id: string; name_en: string }): Promise<Card> {
    const existing = await this.getCardByScryfallId(cardData.scryfall_id);
    if (existing) {
      const [updated] = await db.update(cards)
        .set({ ...cardData, cached_at: new Date() })
        .where(eq(cards.scryfall_id, cardData.scryfall_id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(cards).values(cardData as InsertCard).returning();
    return created;
  }

  async searchCardsCached(query: string): Promise<Card[]> {
    const q = `%${query}%`;
    return await db.select().from(cards)
      .where(or(
        ilike(cards.name_en, q),
        ilike(cards.name_cn, q)
      ))
      .limit(20);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db.insert(cards).values(insertCard).returning();
    return card;
  }

  async getPosts(): Promise<(Post & { user: User; card?: Card })[]> {
    const results = await db
      .select({ post: posts, user: users, card: cards })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(cards, eq(posts.cardId, cards.id))
      .orderBy(desc(posts.createdAt));
    return results.map((r) => ({ ...r.post, user: r.user, card: r.card || undefined }));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async getUserCards(userId: number): Promise<(UserCard & { card: Card })[]> {
    const results = await db
      .select({ userCard: userCards, card: cards })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, userId));
    return results.map((r) => ({ ...r.userCard, card: r.card }));
  }

  async addUserCard(insertUserCard: InsertUserCard): Promise<UserCard> {
    const [userCard] = await db.insert(userCards).values(insertUserCard).returning();
    return userCard;
  }

  async getPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).orderBy(desc(priceLists.createdAt));
  }

  async getPriceList(id: number): Promise<PriceList | undefined> {
    const [list] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return list;
  }

  async createPriceList(list: InsertPriceList): Promise<PriceList> {
    const [created] = await db.insert(priceLists).values(list).returning();
    return created;
  }

  async updatePriceList(id: number, data: Partial<InsertPriceList>): Promise<PriceList | undefined> {
    const [updated] = await db.update(priceLists).set(data).where(eq(priceLists.id, id)).returning();
    return updated;
  }

  async deletePriceList(id: number): Promise<void> {
    await db.delete(priceListItems).where(eq(priceListItems.listId, id));
    await db.delete(priceLists).where(eq(priceLists.id, id));
  }

  async getPriceListItems(listId: number): Promise<PriceListItem[]> {
    return await db.select().from(priceListItems).where(eq(priceListItems.listId, listId)).orderBy(desc(priceListItems.createdAt));
  }

  async addPriceListItem(item: InsertPriceListItem): Promise<PriceListItem> {
    const [created] = await db.insert(priceListItems).values(item).returning();
    return created;
  }

  async updatePriceListItem(id: number, data: Partial<InsertPriceListItem>): Promise<PriceListItem | undefined> {
    const [updated] = await db.update(priceListItems).set(data).where(eq(priceListItems.id, id)).returning();
    return updated;
  }

  async removePriceListItem(id: number): Promise<void> {
    await db.delete(priceListItems).where(eq(priceListItems.id, id));
  }

  async getFollowedCards(): Promise<FollowedCard[]> {
    return await db.select().from(followedCards).orderBy(desc(followedCards.createdAt));
  }

  async addFollowedCard(card: InsertFollowedCard): Promise<FollowedCard> {
    const [created] = await db.insert(followedCards).values(card).returning();
    return created;
  }

  async removeFollowedCard(id: number): Promise<void> {
    await db.delete(followedCards).where(eq(followedCards.id, id));
  }

  async getCardHistory(): Promise<CardHistory[]> {
    const all = await db.select().from(cardHistory).orderBy(desc(cardHistory.viewedAt));
    const seen = new Set<string>();
    return all.filter(entry => {
      if (seen.has(entry.scryfallId)) return false;
      seen.add(entry.scryfallId);
      return true;
    });
  }

  async addCardHistory(entry: InsertCardHistory): Promise<CardHistory> {
    const [created] = await db.insert(cardHistory).values(entry).returning();
    return created;
  }

  async getSetting(key: string): Promise<UserSetting | undefined> {
    const [setting] = await db.select().from(userSettings).where(eq(userSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<UserSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(userSettings).set({ value }).where(eq(userSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(userSettings).values({ key, value }).returning();
    return created;
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [created] = await db.insert(communityPosts).values(post).returning();
    return created;
  }

  async likeCommunityPost(id: number): Promise<CommunityPost | undefined> {
    const [existing] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    if (!existing) return undefined;
    const [updated] = await db.update(communityPosts).set({ likes: existing.likes + 1 }).where(eq(communityPosts.id, id)).returning();
    return updated;
  }

  async addPriceSnapshot(entry: InsertPriceHistory): Promise<PriceHistory> {
    const [created] = await db.insert(priceHistory).values(entry).returning();
    return created;
  }

  async getPriceHistory(scryfallId: string, days?: number): Promise<PriceHistory[]> {
    const query = db.select().from(priceHistory)
      .where(eq(priceHistory.scryfallId, scryfallId))
      .orderBy(priceHistory.recordedAt);

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return await query.where(
        and(
          eq(priceHistory.scryfallId, scryfallId),
          gte(priceHistory.recordedAt, cutoffDate)
        )
      );
    }

    return await query;
  }

  async getLatestPriceSnapshot(scryfallId: string, source?: string): Promise<PriceHistory | undefined> {
    const conditions = source
      ? and(eq(priceHistory.scryfallId, scryfallId), eq(priceHistory.source, source))
      : eq(priceHistory.scryfallId, scryfallId);

    const [snapshot] = await db.select()
      .from(priceHistory)
      .where(conditions)
      .orderBy(desc(priceHistory.recordedAt))
      .limit(1);

    return snapshot;
  }
}

export const storage = new DatabaseStorage();
