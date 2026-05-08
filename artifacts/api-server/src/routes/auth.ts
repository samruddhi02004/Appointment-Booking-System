import { Router } from "express";
import { db, usersTable, eq } from "@workspace/db";
import {
  SignupBody,
  VerifyOtpBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  UpdateProfileBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  generateOtp,
  generateToken,
  requireAuth,
  type AuthRequest,
} from "../lib/auth";

const router = Router();

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

function makeToken(userId: number): string {
  return `${userId}:${generateToken()}`;
}

// POST /auth/signup
router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { fullName, email, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    // If account exists but is unverified, auto-verify and log them in
    const existingUser = existing[0];
    if (!existingUser.isVerified) {
      await db
        .update(usersTable)
        .set({ isVerified: true, otp: null, otpExpiresAt: null })
        .where(eq(usersTable.id, existingUser.id));
      const [verified] = await db.select().from(usersTable).where(eq(usersTable.id, existingUser.id)).limit(1);
      const token = makeToken(verified.id);
      res.cookie("authToken", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 3600 * 1000 });
      res.status(201).json({ user: userToResponse(verified), token, requiresVerification: false });
      return;
    }
    res.status(400).json({ error: "ConflictError", message: "Email already in use" });
    return;
  }

  // Auto-verify on signup — no email service in this environment
  const result = await db
    .insert(usersTable)
    .values({
      fullName,
      email,
      passwordHash: hashPassword(password),
      isVerified: true,
      role: "customer",
    });

  const insertId = Number((result as any)[0].insertId);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, insertId)).limit(1);

  req.log.info({ userId: user.id }, "New user registered and auto-verified");

  const token = makeToken(user.id);
  res.cookie("authToken", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 3600 * 1000 });

  res.status(201).json({
    user: userToResponse(user),
    token,
    requiresVerification: false,
  });
});

// POST /auth/verify-otp
router.post("/auth/verify-otp", async (req, res) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { email, otp } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(400).json({ error: "NotFound", message: "User not found" });
    return;
  }

  if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "InvalidOtp", message: "Invalid or expired OTP" });
    return;
  }

  await db
    .update(usersTable)
    .set({ isVerified: true, otp: null, otpExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  const token = makeToken(updated.id);
  res.cookie("authToken", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 3600 * 1000 });

  res.json({ user: userToResponse(updated), token, requiresVerification: false });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Forbidden", message: "Account is deactivated" });
    return;
  }

  const token = makeToken(user.id);
  res.cookie("authToken", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 3600 * 1000 });

  res.json({
    user: userToResponse(user),
    token,
    requiresVerification: !user.isVerified,
  });
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { email } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user) {
    const otp = generateOtp();
    await db
      .update(usersTable)
      .set({ otp, otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000) })
      .where(eq(usersTable.id, user.id));
    req.log.info({ userId: user.id, otp }, "Password reset OTP (dev: otp in logs)");
  }

  res.json({ message: "If the email exists, an OTP has been sent" });
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { email, otp, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "InvalidOtp", message: "Invalid or expired OTP" });
    return;
  }

  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(newPassword), otp: null, otpExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password reset successfully" });
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({ message: "Logged out" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "NotFound", message: "User not found" });
    return;
  }
  res.json(userToResponse(user));
});

// PUT /auth/me/profile
router.put("/auth/me/profile", requireAuth, async (req: AuthRequest, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }

  const updates: Partial<{ fullName: string; email: string }> = {};
  if (parsed.data.fullName) updates.fullName = parsed.data.fullName;
  if (parsed.data.email) updates.email = parsed.data.email;

  await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.id));

  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  res.json(userToResponse(updated));
});

export default router;
