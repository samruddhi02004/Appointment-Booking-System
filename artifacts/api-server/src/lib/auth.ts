import { createHash, randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, usersTable, eq } from "@workspace/db";

export function hashPassword(password: string): string {
  const salt = "bookslot_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "customer" | "organiser" | "admin";
    fullName: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "No auth token provided" });
    return;
  }

  // Simple token lookup: token = userId:hash stored in cookie
  try {
    const parts = token.split(":");
    if (parts.length !== 2) throw new Error("Invalid token format");
    const userId = parseInt(parts[0]);
    if (isNaN(userId)) throw new Error("Invalid user id in token");

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid or inactive account" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
        return;
      }
      next();
    });
  };
}
