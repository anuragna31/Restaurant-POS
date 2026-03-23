import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { z } from "zod";
import { newId } from "../utils/uuid";

export const tablesRouter = Router();

tablesRouter.get("/", requireAuth(), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const activeShift = await knexInstance("shifts").select("id").where({ is_active: true }).first();
    const activeShiftId = activeShift?.id;

    let q = knexInstance("tables as t")
      .leftJoin("table_assignments as ta", function () {
        this.on("ta.table_id", "=", "t.id");
        if (activeShiftId) this.andOn("ta.shift_id", "=", knexInstance!.raw("?", [activeShiftId]));
        else this.andOn(knexInstance!.raw("1 = 0"));
      })
      .leftJoin("users as u", "ta.waiter_id", "u.id")
      .select(
        "t.id",
        "t.number",
        "t.name",
        "t.seating_capacity",
        "t.status",
        knexInstance.raw("COALESCE(ta.waiter_id, t.assigned_waiter_id) as assigned_waiter_id"),
        "u.name as assigned_waiter_name",
        "u.username as assigned_waiter_username"
      )
      .orderBy("t.number", "asc");
    if (req.user?.role === "WAITER") {
      q = q.where(function () {
        this.where("ta.waiter_id", req.user!.id).orWhere("t.assigned_waiter_id", req.user!.id);
      });
    }
    const rows = await q;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tables" });
  }
});

tablesRouter.get("/shifts/active", requireAuth(["MANAGER"]), async (_req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const shift = await knexInstance("shifts")
      .select("id", "name", "start_time", "end_time", "is_active")
      .where({ is_active: true })
      .orderBy("start_time", "desc")
      .first();
    if (!shift) return res.status(404).json({ message: "No active shift found" });
    res.json(shift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load active shift" });
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

const assignTableSchema = z.object({
  waiter_id: z.string().uuid().nullable(),
  shift_id: z.string().uuid().optional()
});

tablesRouter.post("/:id/assign", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = assignTableSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
  try {
    const tableId = req.params.id;
    let shiftId = parse.data.shift_id;
    if (!shiftId) {
      const activeShift = await knexInstance("shifts").select("id").where({ is_active: true }).first();
      if (!activeShift?.id) return res.status(400).json({ message: "No active shift found for assignment" });
      shiftId = activeShift.id;
    }

    if (!parse.data.waiter_id) {
      await knexInstance("table_assignments").where({ table_id: tableId, shift_id: shiftId }).delete();
      await knexInstance("tables").where({ id: tableId }).update({ assigned_waiter_id: null });
      return res.json({ ok: true });
    }

    const existing = await knexInstance("table_assignments").where({ table_id: tableId, shift_id: shiftId }).first();
    if (existing) {
      await knexInstance("table_assignments")
        .where({ id: existing.id })
        .update({ waiter_id: parse.data.waiter_id, assigned_at: knexInstance.fn.now() });
    } else {
      await knexInstance("table_assignments").insert({
        id: newId(),
        table_id: tableId,
        waiter_id: parse.data.waiter_id,
        shift_id: shiftId
      });
    }

    await knexInstance("tables").where({ id: tableId }).update({ assigned_waiter_id: parse.data.waiter_id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign table" });
  }
});
