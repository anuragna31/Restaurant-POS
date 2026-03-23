import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  role: "WAITER" | "CHEF" | "MANAGER";
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(roles?: AuthUser["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.slice("Bearer ".length);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server misconfigured: JWT_SECRET missing" });
    }
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        sub: string;
        role: AuthUser["role"];
        name: string;
      };
      req.user = { id: decoded.sub, role: decoded.role, name: decoded.name };
      if (roles && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

