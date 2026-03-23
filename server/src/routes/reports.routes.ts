import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth } from "../middlewares/auth";

export const reportsRouter = Router();

function getRangeStart(range: string | undefined) {
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setDate(now.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

reportsRouter.get("/summary", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const range = typeof req.query.range === "string" ? req.query.range : "day";
  const start = getRangeStart(range);
  try {
    const orders = await knexInstance("orders")
      .select("id", "status", "created_at")
      .where("created_at", ">=", start.toISOString());
    const orderIds = orders.map((o: any) => o.id);
    let revenue = 0;
    if (orderIds.length > 0) {
      const rows = await knexInstance("order_items")
        .select(knexInstance.raw("SUM(quantity * price_at_order) as total"))
        .whereIn("order_id", orderIds);
      revenue = Number(rows?.[0]?.total || 0);
    }
    const completed = orders.filter((o: any) => o.status === "SERVED").length;
    const cancelled = orders.filter((o: any) => o.status === "CANCELLED").length;
    res.json({
      range,
      from: start.toISOString(),
      total_orders: orders.length,
      completed_orders: completed,
      cancelled_orders: cancelled,
      revenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load summary report" });
  }
});

reportsRouter.get("/waiter-performance", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const range = typeof req.query.range === "string" ? req.query.range : "day";
  const start = getRangeStart(range);
  try {
    const rows = await knexInstance("orders as o")
      .leftJoin("users as u", "o.waiter_id", "u.id")
      .leftJoin("order_items as oi", "oi.order_id", "o.id")
      .where("o.created_at", ">=", start.toISOString())
      .groupBy("o.waiter_id", "u.name", "u.username")
      .select(
        "o.waiter_id",
        "u.name as waiter_name",
        "u.username as waiter_username",
        knexInstance.raw("COUNT(DISTINCT o.id) as total_orders"),
        knexInstance.raw("SUM(CASE WHEN o.status = 'SERVED' THEN 1 ELSE 0 END) as completed_orders"),
        knexInstance.raw("COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as revenue")
      )
      .orderBy("revenue", "desc");
    res.json({ range, from: start.toISOString(), rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load waiter performance report" });
  }
});

reportsRouter.get("/popular-items", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const range = typeof req.query.range === "string" ? req.query.range : "day";
  const start = getRangeStart(range);
  try {
    const rows = await knexInstance("order_items as oi")
      .leftJoin("orders as o", "oi.order_id", "o.id")
      .leftJoin("menu_items as mi", "oi.menu_item_id", "mi.id")
      .where("o.created_at", ">=", start.toISOString())
      .whereNot("o.status", "CANCELLED")
      .groupBy("oi.menu_item_id", "mi.name")
      .select(
        "oi.menu_item_id",
        "mi.name as item_name",
        knexInstance.raw("SUM(oi.quantity) as quantity_sold"),
        knexInstance.raw("COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as revenue")
      )
      .orderBy("quantity_sold", "desc")
      .limit(10);
    res.json({ range, from: start.toISOString(), rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load popular items report" });
  }
});

reportsRouter.get("/sales", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const range = typeof req.query.range === "string" ? req.query.range : "day";
  const start = getRangeStart(range);
  try {
    const rows = await knexInstance("orders as o")
      .leftJoin("order_items as oi", "oi.order_id", "o.id")
      .where("o.created_at", ">=", start.toISOString())
      .whereNot("o.status", "CANCELLED")
      .groupByRaw("DATE(o.created_at)")
      .select(
        knexInstance.raw("DATE(o.created_at) as period"),
        knexInstance.raw("COUNT(DISTINCT o.id) as orders_count"),
        knexInstance.raw("COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as revenue")
      )
      .orderBy("period", "asc");
    res.json({ range, from: start.toISOString(), rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load sales report" });
  }
});

reportsRouter.get("/export.csv", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  const range = typeof req.query.range === "string" ? req.query.range : "day";
  const start = getRangeStart(range);
  try {
    const rows = await knexInstance("orders as o")
      .leftJoin("tables as t", "o.table_id", "t.id")
      .leftJoin("users as u", "o.waiter_id", "u.id")
      .leftJoin("order_items as oi", "oi.order_id", "o.id")
      .where("o.created_at", ">=", start.toISOString())
      .groupBy("o.id", "o.status", "o.created_at", "t.number", "u.name", "u.username")
      .select(
        "o.id",
        "o.status",
        "o.created_at",
        "t.number as table_number",
        "u.name as waiter_name",
        "u.username as waiter_username",
        knexInstance.raw("COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as order_total")
      )
      .orderBy("o.created_at", "desc");

    const header = ["order_id", "status", "created_at", "table_number", "waiter_name", "waiter_username", "order_total"];
    const lines = [header.join(",")];
    for (const r of rows as any[]) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(r.status),
          csvEscape(r.created_at),
          csvEscape(r.table_number),
          csvEscape(r.waiter_name),
          csvEscape(r.waiter_username),
          csvEscape(Number(r.order_total || 0).toFixed(2))
        ].join(",")
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reports-${range}.csv"`);
    res.send(lines.join("\n"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export CSV report" });
  }
});
