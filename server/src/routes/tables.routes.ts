import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { newId } from "../utils/uuid";

export const tablesRouter = Router();

tablesRouter.get("/", requireAuth(), async (_req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const rows = await knexInstance("tables as t")
      .leftJoin("users as u", "t.assigned_waiter_id", "u.id")
      .select(
        "t.id",
        "t.number",
        "t.name",
        "t.seating_capacity",
        "t.status",
        "t.assigned_waiter_id",
        "u.name as assigned_waiter_name",
        "u.username as assigned_waiter_username"
      )
      .orderBy("t.number", "asc");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tables" });
  }
});

const createTableSchema = z.object({
  number: z.number().int().positive(),
  seating_capacity: z.number().int().positive()
});

tablesRouter.post("/", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = createTableSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });

  try {
    const t = parse.data;
    await knexInstance("tables").insert({
      id: newId(),
      number: t.number,
      seating_capacity: t.seating_capacity,
      name: null,
      status: "FREE",
      assigned_waiter_id: null
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create table" });
  }
});

const patchTableSchema = z.object({
  seating_capacity: z.number().int().positive().optional(),
  status: z.enum(["FREE", "OCCUPIED", "ORDER_IN_PROGRESS"]).optional(),
  assigned_waiter_id: z.string().uuid().nullable().optional()
});

tablesRouter.patch("/:id", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = patchTableSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
  try {
    await knexInstance("tables").where({ id: req.params.id }).update(parse.data as any);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update table" });
  }
});

tablesRouter.delete("/:id", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    await knexInstance("tables").where({ id: req.params.id }).delete();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete table" });
  }
});
