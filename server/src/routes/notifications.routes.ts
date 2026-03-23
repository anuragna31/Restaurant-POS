import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth, AuthRequest } from "../middlewares/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth(), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const rows = await knexInstance("notifications")
      .select("id", "user_id", "title", "body", "type", "is_read", "created_at")
      .where({ user_id: req.user!.id })
      .orderBy("created_at", "desc")
      .limit(50);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

notificationsRouter.patch("/:id/read", requireAuth(), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const updated = await knexInstance("notifications")
      .where({ id: req.params.id, user_id: req.user!.id })
      .update({ is_read: true });
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

notificationsRouter.patch("/read-all", requireAuth(), async (req: AuthRequest, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    await knexInstance("notifications").where({ user_id: req.user!.id, is_read: false }).update({ is_read: true });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});
