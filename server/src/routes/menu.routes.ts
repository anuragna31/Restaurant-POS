import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { newId } from "../utils/uuid";

export const menuRouter = Router();

menuRouter.get("/items", requireAuth(), async (_req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const items = await knexInstance("menu_items as mi")
      .leftJoin("menu_categories as mc", "mi.category_id", "mc.id")
      .select(
        "mi.id",
        "mi.name",
        "mi.description",
        "mi.price",
        "mi.image_url",
        "mi.is_available",
        "mc.name as category"
      )
      .orderBy("mc.sort_order", "asc")
      .orderBy("mi.name", "asc");
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load menu items" });
  }
});

menuRouter.get("/categories", requireAuth(), async (_req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const rows = await knexInstance("menu_categories").select("*").orderBy("sort_order", "asc");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

const upsertItemSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(255),
  price: z.number().nonnegative(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().max(2000).optional().nullable(),
  is_available: z.boolean().optional()
});

async function ensureCategory(name: string) {
  const existing = await knexInstance!("menu_categories").where({ name }).first();
  if (existing) return existing.id;
  const id = newId();
  const sortOrder = (await knexInstance!("menu_categories").count<{ c: string }>("id as c").first())?.c;
  await knexInstance!("menu_categories").insert({ id, name, sort_order: Number(sortOrder ?? 0) + 1 });
  return id;
}

menuRouter.post("/items", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = upsertItemSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
  try {
    const data = parse.data;
    const categoryId = await ensureCategory(data.category);
    await knexInstance("menu_items").insert({
      id: newId(),
      category_id: categoryId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      image_url: data.image_url ?? null,
      is_available: data.is_available ?? true
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create menu item" });
  }
});

menuRouter.patch("/items/:id", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = upsertItemSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
  try {
    const data = parse.data;
    const categoryId = await ensureCategory(data.category);
    await knexInstance("menu_items").where({ id: req.params.id }).update({
      category_id: categoryId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      image_url: data.image_url ?? null,
      is_available: data.is_available ?? true
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update menu item" });
  }
});

menuRouter.delete("/items/:id", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    await knexInstance("menu_items").where({ id: req.params.id }).delete();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete menu item" });
  }
});
