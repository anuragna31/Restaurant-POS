import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { knexInstance, dbClient } from "../db/knexClient";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});

authRouter.post("/login", async (req, res) => {
  if (!knexInstance || dbClient === "mongodb") {
    return res.status(500).json({ message: "SQL database not configured" });
  }

  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const { username, password } = parse.data;

  try {
    const user = await knexInstance("users")
      .where({ username })
      .orWhere({ email: username })
      .first();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

