import { Router } from "express";
import { knexInstance, dbClient } from "../db/knexClient";
import { requireAuth } from "../middlewares/auth";

export const usersRouter = Router();

usersRouter.get("/", requireAuth(["MANAGER"]), async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }
  try {
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    let q = knexInstance("users").select("id", "name", "username", "email", "role", "is_active", "created_at");
    if (role) q = q.where({ role });
    const rows = await q.orderBy("role", "asc").orderBy("name", "asc");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

