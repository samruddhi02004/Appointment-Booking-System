import { Router } from "express";
import { db, usersTable, eq, like, and } from "@workspace/db";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function firstParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function userToResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /users
router.get("/users", requireRole("admin"), async (req: AuthRequest, res) => {
  const { role, active, search } = req.query;
  let users = await db.select().from(usersTable);
  if (role && typeof role === "string") {
    users = users.filter((u) => u.role === role);
  }
  if (active !== undefined) {
    users = users.filter((u) => u.isActive === (active === "true"));
  }
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    users = users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  res.json(users.map(userToResponse));
});

// GET /users/:userId
router.get("/users/:userId", requireRole("admin"), async (req, res) => {
  const id = parseInt(firstParam(req.params.userId), 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "NotFound", message: "User not found" });
    return;
  }
  res.json(userToResponse(user));
});

// PUT /users/:userId
router.put("/users/:userId", requireRole("admin"), async (req, res) => {
  const id = parseInt(firstParam(req.params.userId), 10);
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const updates: Partial<{ fullName: string; role: "customer" | "organiser" | "admin"; isActive: boolean }> = {};
  if (parsed.data.fullName) updates.fullName = parsed.data.fullName;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  await db.update(usersTable).set(updates).where(eq(usersTable.id, id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!updated) {
    res.status(404).json({ error: "NotFound", message: "User not found" });
    return;
  }
  res.json(userToResponse(updated));
});

// POST /users/:userId/toggle-active
router.post("/users/:userId/toggle-active", requireRole("admin"), async (req, res) => {
  const id = parseInt(firstParam(req.params.userId), 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "NotFound", message: "User not found" });
    return;
  }
  await db.update(usersTable).set({ isActive: !user.isActive }).where(eq(usersTable.id, id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.json(userToResponse(updated));
});

export default router;
