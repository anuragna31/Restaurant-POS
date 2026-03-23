import { Router } from "express";
import { z } from "zod";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { newId } from "../utils/uuid";
import type { Server as SocketIOServer } from "socket.io";

export const ordersRouter = Router();

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  special_instructions: z.string().max(500).optional()
});

const createOrderSchema = z.object({
  table_id: z.string().uuid(),
  special_instructions: z.string().max(1000).optional(),
  items: z.array(orderItemSchema).min(1)
});

async function hydrateOrders(baseOrders: any[], trx = knexInstance!) {
  const orderIds = baseOrders.map((o) => o.id);
  if (orderIds.length === 0) return [];

  const items = await trx("order_items as oi")
    .leftJoin("menu_items as mi", "oi.menu_item_id", "mi.id")
    .select(
      "oi.id",
      "oi.order_id",
      "oi.quantity",
      "oi.price_at_order",
      "oi.status",
      "mi.name as menu_item_name"
    )
    .whereIn("oi.order_id", orderIds);

  const byOrder = new Map<string, any[]>();
  for (const it of items as any[]) {
    const arr = byOrder.get(it.order_id) || [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  }

  return baseOrders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] }));
}

ordersRouter.get("/", requireAuth(), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const mine = req.query.mine === "1";
    const active = req.query.active === "1";
    const tableId = typeof req.query.tableId === "string" ? req.query.tableId : undefined;
    const waiterId = typeof req.query.waiterId === "string" ? req.query.waiterId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    let q = knexInstance("orders as o")
      .leftJoin("tables as t", "o.table_id", "t.id")
      .leftJoin("users as u", "o.waiter_id", "u.id")
      .select(
        "o.*",
        "t.number as table_number",
        "u.name as waiter_name",
        "u.username as waiter_username"
      )
      .orderBy("o.created_at", "desc")
      .limit(50);

    if (mine) q = q.where("o.waiter_id", req.user!.id);
    if (active) q = q.whereIn("o.status", ["PENDING", "IN_PROGRESS", "READY"]);
    if (tableId) q = q.where("o.table_id", tableId);
    if (waiterId) q = q.where("o.waiter_id", waiterId);
    if (status) q = q.where("o.status", status);
    if (from) q = q.where("o.created_at", ">=", from);
    if (to) q = q.where("o.created_at", "<=", to);
    if (search) {
      const searchNumber = Number(search);
      q = q.where((qb) => {
        if (Number.isFinite(searchNumber)) qb.where("t.number", searchNumber);
        qb.orWhere("u.name", "like", `%${search}%`).orWhere("u.username", "like", `%${search}%`);
      });
    }

    const base = await q;
    const hydrated = await hydrateOrders(base as any[]);
    res.json(hydrated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

ordersRouter.post("/", requireAuth(["WAITER", "MANAGER"]), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }
  const data = parse.data;

  try {
    const order = await knexInstance.transaction(async (trx) => {
      const menuItemIds = data.items.map((i) => i.menu_item_id);
      const menuItems = await trx("menu_items").whereIn("id", menuItemIds).select("id", "price");
      const priceById = new Map(menuItems.map((m: any) => [m.id, m.price]));

      const orderId = newId();
      await trx("orders").insert({
        id: orderId,
        table_id: data.table_id,
        waiter_id: req.user!.id,
        status: "PENDING",
        special_instructions: data.special_instructions ?? null
      });

      const itemRows = data.items.map((it) => ({
        id: newId(),
        order_id: orderId,
        menu_item_id: it.menu_item_id,
        quantity: it.quantity,
        price_at_order: Number(priceById.get(it.menu_item_id) ?? 0),
        status: "PENDING",
        special_instructions: it.special_instructions ?? null
      }));
      await trx("order_items").insert(itemRows);

      await trx("tables").where({ id: data.table_id }).update({ status: "OCCUPIED" });

      const createdOrder = await trx("orders").where({ id: orderId }).first();
      return createdOrder;
    });

    const io = req.app.get("io") as SocketIOServer | undefined;
    io?.emit("order:created", { orderId: order.id });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

const patchStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "READY", "SERVED", "CANCELLED"])
});

ordersRouter.patch("/:id/status", requireAuth(["CHEF", "MANAGER", "WAITER"]), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = patchStatusSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });

  const id = req.params.id;
  const status = parse.data.status;

  try {
    const order = await knexInstance("orders").where({ id }).first();
    if (!order) return res.status(404).json({ message: "Not found" });

    // basic role rules
    if (req.user?.role === "WAITER" && order.waiter_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const update: any = { status };
    if (status === "SERVED" || status === "CANCELLED") update.completed_at = knexInstance.fn.now();

    await knexInstance("orders").where({ id }).update(update);

    if (status === "SERVED" || status === "CANCELLED") {
      const activeCount = await knexInstance("orders")
        .where({ table_id: order.table_id })
        .whereIn("status", ["PENDING", "IN_PROGRESS", "READY"])
        .count<{ c: string }>("id as c")
        .first();
      if (!activeCount || Number(activeCount.c) === 0) {
        await knexInstance("tables").where({ id: order.table_id }).update({ status: "FREE" });
      }
    }

    const updated = await knexInstance("orders").where({ id }).first();
    const io = req.app.get("io") as SocketIOServer | undefined;
    io?.emit("order:statusUpdated", { orderId: id, status });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order" });
  }
});
