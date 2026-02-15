import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPriceListSchema, insertPriceListItemSchema, insertFollowedCardSchema, insertCardHistorySchema, insertCommunityPostSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export async function registerRoutes(
  app: Express
): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
