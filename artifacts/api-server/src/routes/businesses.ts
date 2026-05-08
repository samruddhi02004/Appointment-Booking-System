import { Router } from "express";
import {
  db,
  businessesTable,
  businessMembersTable,
  usersTable,
  appointmentTypesTable,
  bookingsTable,
  eq,
  like,
  and,
  count,
  sql,
  inArray,
} from "@workspace/db";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function firstParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function userToObj(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
  };
}

async function businessToResponse(biz: typeof businessesTable.$inferSelect, includeOwner = true) {
  let owner = undefined;
  if (includeOwner) {
    const [ownerRow] = await db.select().from(usersTable).where(eq(usersTable.id, biz.ownerId)).limit(1);
    owner = ownerRow ? userToObj(ownerRow) : undefined;
  }
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(appointmentTypesTable)
    .where(and(eq(appointmentTypesTable.businessId, biz.id), eq(appointmentTypesTable.isPublished, true)));

  return {
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    description: biz.description,
    category: biz.category,
    logoUrl: biz.logoUrl,
    coverUrl: biz.coverUrl,
    address: biz.address,
    city: biz.city,
    country: biz.country,
    phone: biz.phone,
    website: biz.website,
    email: biz.email,
    ownerId: biz.ownerId,
    owner,
    isActive: biz.isActive,
    isVerified: biz.isVerified,
    appointmentCount: Number(cnt),
    createdAt: biz.createdAt.toISOString(),
  };
}

// GET /businesses — public list
router.get("/businesses", async (req: AuthRequest, res) => {
  const { category, search, city } = req.query;
  let businesses = await db.select().from(businessesTable).where(eq(businessesTable.isActive, true));
  if (category && typeof category === "string") {
    businesses = businesses.filter((b) => b.category === category);
  }
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    businesses = businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description?.toLowerCase().includes(q) ?? false) ||
        (b.city?.toLowerCase().includes(q) ?? false)
    );
  }
  if (city && typeof city === "string") {
    businesses = businesses.filter((b) => b.city?.toLowerCase().includes(city.toLowerCase()));
  }
  const results = await Promise.all(businesses.map((b) => businessToResponse(b)));
  res.json(results);
});

// GET /businesses/my
router.get("/businesses/my", requireAuth, async (req: AuthRequest, res) => {
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.ownerId, req.user!.id)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "No business found for this user" });
    return;
  }
  res.json(await businessToResponse(biz));
});

// GET /businesses/slug/:slug
router.get("/businesses/slug/:slug", async (req: AuthRequest, res) => {
  const slug = firstParam(req.params.slug);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "Business not found" });
    return;
  }
  res.json(await businessToResponse(biz));
});

// GET /businesses/:businessId
router.get("/businesses/:businessId", async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.businessId), 10);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "Business not found" });
    return;
  }
  res.json(await businessToResponse(biz));
});

// POST /businesses
router.post("/businesses", requireAuth, async (req: AuthRequest, res) => {
  const { name, description, category, logoUrl, coverUrl, address, city, country, phone, website, email } = req.body;
  if (!name || !category) {
    res.status(400).json({ error: "ValidationError", message: "name and category are required" });
    return;
  }
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug)).limit(1);
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const result = await db
    .insert(businessesTable)
    .values({ name, slug, description, category, logoUrl, coverUrl, address, city, country, phone, website, email, ownerId: req.user!.id });

  const insertId = Number((result as any)[0].insertId);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, insertId)).limit(1);

  await db.insert(businessMembersTable).values({ businessId: biz.id, userId: req.user!.id, role: "owner" });
  res.status(201).json(await businessToResponse(biz));
});

// PUT /businesses/:businessId
router.put("/businesses/:businessId", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.businessId), 10);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "Business not found" });
    return;
  }
  if (biz.ownerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "You do not own this business" });
    return;
  }
  const { name, description, category, logoUrl, coverUrl, address, city, country, phone, website, email, isActive } = req.body;
  await db
    .update(businessesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(coverUrl !== undefined && { coverUrl }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(country !== undefined && { country }),
      ...(phone !== undefined && { phone }),
      ...(website !== undefined && { website }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
    })
    .where(eq(businessesTable.id, id));

  const [updated] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  res.json(await businessToResponse(updated));
});

// GET /businesses/:businessId/members
router.get("/businesses/:businessId/members", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.businessId), 10);
  const members = await db.select().from(businessMembersTable).where(eq(businessMembersTable.businessId, id));
  const results = await Promise.all(
    members.map(async (m) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId)).limit(1);
      return {
        id: m.id, businessId: m.businessId, userId: m.userId,
        user: user ? userToObj(user) : undefined,
        role: m.role, joinedAt: m.joinedAt.toISOString(),
      };
    })
  );
  res.json(results);
});

// POST /businesses/:businessId/members
router.post("/businesses/:businessId/members", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.businessId), 10);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "Business not found" });
    return;
  }
  if (biz.ownerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "You do not own this business" });
    return;
  }
  const { email, role = "staff" } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(404).json({ error: "NotFound", message: "User not found with that email" });
    return;
  }
  const result = await db.insert(businessMembersTable).values({ businessId: id, userId: user.id, role });
  const memberId = Number((result as any)[0].insertId);
  const [member] = await db.select().from(businessMembersTable).where(eq(businessMembersTable.id, memberId)).limit(1);
  res.status(201).json({
    id: member.id, businessId: member.businessId, userId: member.userId,
    user: userToObj(user), role: member.role, joinedAt: member.joinedAt.toISOString(),
  });
});

// DELETE /businesses/:businessId/members/:memberId
router.delete("/businesses/:businessId/members/:memberId", requireAuth, async (req: AuthRequest, res) => {
  const bizId = parseInt(firstParam(req.params.businessId), 10);
  const memberId = parseInt(firstParam(req.params.memberId), 10);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, bizId)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "NotFound", message: "Business not found" });
    return;
  }
  if (biz.ownerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "You do not own this business" });
    return;
  }
  await db.delete(businessMembersTable).where(eq(businessMembersTable.id, memberId));
  res.status(204).send();
});

// GET /businesses/:businessId/stats
router.get("/businesses/:businessId/stats", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.businessId), 10);
  const apts = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.businessId, id));
  const aptIds = apts.map((a) => a.id);

  let allBookings: typeof bookingsTable.$inferSelect[] = [];
  if (aptIds.length > 0) {
    allBookings = await db.select().from(bookingsTable).where(inArray(bookingsTable.appointmentTypeId, aptIds));
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const members = await db.select().from(businessMembersTable).where(eq(businessMembersTable.businessId, id));

  const totalRevenue = allBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (Number(b.capacity) * 0), 0);

  res.json({
    totalAppointmentTypes: apts.length,
    publishedAppointmentTypes: apts.filter((a) => a.isPublished).length,
    totalBookings: allBookings.length,
    confirmedBookings: allBookings.filter((b) => b.status === "confirmed").length,
    pendingBookings: allBookings.filter((b) => b.status === "pending").length,
    cancelledBookings: allBookings.filter((b) => b.status === "cancelled").length,
    todayBookings: allBookings.filter((b) => b.startTime >= todayStart && b.startTime < todayEnd).length,
    upcomingBookings: allBookings.filter((b) => b.startTime > now && b.status !== "cancelled").length,
    totalRevenue,
    totalStaff: members.length,
  });
});

export default router;
