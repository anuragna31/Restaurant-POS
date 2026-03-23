import { Router } from "express";
import { z } from "zod";
import type { Server as SocketIOServer } from "socket.io";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { newId } from "../utils/uuid";

export const kitchenAlertsRouter = Router();

const createKitchenAlertSchema = z.object({
  order_id: z.string().uuid(),
  type: z.enum(["ITEM_UNAVAILABLE", "DELAY", "OTHER"]),
  message: z.string().min(3).max(500)
});

kitchenAlertsRouter.post("/", requireAuth(["CHEF", "MANAGER"]), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const parse = createKitchenAlertSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Invalid payload" });

  try {
    const payload = parse.data;
    const order = await knexInstance("orders as o")
      .leftJoin("tables as t", "o.table_id", "t.id")
      .select("o.id", "o.waiter_id", "t.number as table_number")
      .where("o.id", payload.order_id)
      .first();
    if (!order) return res.status(404).json({ message: "Order not found" });

    await knexInstance("kitchen_alerts").insert({
      id: newId(),
      order_id: payload.order_id,
      sender_id: req.user!.id,
      message: payload.message,
      type: payload.type
    });

    const managerRows = await knexInstance("users").select("id").where({ role: "MANAGER", is_active: true });
    const targetUserIds = new Set<string>([order.waiter_id, ...managerRows.map((u: any) => u.id)]);
    targetUserIds.delete(req.user!.id);

    const title = payload.type === "DELAY" ? "Kitchen delay alert" : "Kitchen issue alert";
    const body = `Order #${String(order.id).slice(0, 8).toUpperCase()} (Table ${order.table_number ?? "?"}): ${payload.message}`;
    const inserts = Array.from(targetUserIds).map((userId) => ({
      id: newId(),
      user_id: userId,
      title,
      body,
      type: "KITCHEN_ALERT"
    }));
    if (inserts.length > 0) await knexInstance("notifications").insert(inserts);

    const io = req.app.get("io") as SocketIOServer | undefined;
    io?.emit("kitchen:alert", { orderId: payload.order_id, type: payload.type });
    io?.emit("notification:created", { orderId: payload.order_id, type: "KITCHEN_ALERT" });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create kitchen alert" });
  }
});
