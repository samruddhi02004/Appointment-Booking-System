import { Router } from "express";
import {
  db,
  bookingsTable,
  appointmentTypesTable,
  usersTable,
  businessesTable,
  eq,
  and,
  ne,
  gte,
  lte,
  inArray,
} from "@workspace/db";
import { CreateBookingBody, UpdateBookingBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function firstParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function bookingToResponse(booking: typeof bookingsTable.$inferSelect) {
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, booking.appointmentTypeId)).limit(1);
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, booking.customerId)).limit(1);
  let provider = null;
  if (booking.providerId) {
    const [p] = await db.select().from(usersTable).where(eq(usersTable.id, booking.providerId)).limit(1);
    provider = p;
  }
  const userToObj = (u: typeof usersTable.$inferSelect) => ({
    id: u.id, fullName: u.fullName, email: u.email, role: u.role,
    isActive: u.isActive, isVerified: u.isVerified, createdAt: u.createdAt.toISOString(),
  });
  return {
    id: booking.id, appointmentTypeId: booking.appointmentTypeId,
    appointmentType: apt ? {
      id: apt.id, title: apt.title, description: apt.description, duration: apt.duration,
      isPublished: apt.isPublished, scheduleType: apt.scheduleType, manageCapacity: apt.manageCapacity,
      maxCapacity: apt.maxCapacity, advancePayment: apt.advancePayment,
      paymentAmount: apt.paymentAmount ? parseFloat(apt.paymentAmount) : null,
      manualConfirmation: apt.manualConfirmation, assignmentType: apt.assignmentType,
      location: apt.location, resourceType: apt.resourceType, workingHours: apt.workingHours,
      createdAt: apt.createdAt.toISOString(),
    } : undefined,
    customerId: booking.customerId, customer: customer ? userToObj(customer) : undefined,
    providerId: booking.providerId, provider: provider ? userToObj(provider) : undefined,
    startTime: booking.startTime.toISOString(), endTime: booking.endTime.toISOString(),
    status: booking.status, capacity: booking.capacity, paymentStatus: booking.paymentStatus,
    answers: booking.answers || [], notes: booking.notes, createdAt: booking.createdAt.toISOString(),
  };
}

// GET /bookings
router.get("/bookings", requireAuth, async (req: AuthRequest, res) => {
  const { status, appointmentId, userId, fromDate, toDate } = req.query;
  let allBookings = await db.select().from(bookingsTable);
  if (req.user!.role === "customer") {
    allBookings = allBookings.filter((b) => b.customerId === req.user!.id);
  }
  if (req.user!.role === "organiser") {
    const myBusinesses = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.ownerId, req.user!.id));
    const myBusinessIds = myBusinesses.map((b) => b.id);
    const myApts = myBusinessIds.length > 0
      ? await db.select({ id: appointmentTypesTable.id }).from(appointmentTypesTable).where(inArray(appointmentTypesTable.businessId, myBusinessIds))
      : [];
    const myAptIds = myApts.map((a) => a.id);
    allBookings = allBookings.filter((b) => myAptIds.includes(b.appointmentTypeId));
  }
  if (status && typeof status === "string") { allBookings = allBookings.filter((b) => b.status === status); }
  const appointmentIdParam = Array.isArray(appointmentId) ? appointmentId[0] : appointmentId;
  if (appointmentIdParam) { allBookings = allBookings.filter((b) => b.appointmentTypeId === parseInt(appointmentIdParam as string)); }
  const userIdParam = Array.isArray(userId) ? userId[0] : userId;
  if (userIdParam) { allBookings = allBookings.filter((b) => b.customerId === parseInt(userIdParam as string)); }
  const fromDateParam = Array.isArray(fromDate) ? fromDate[0] : fromDate;
  if (fromDateParam && typeof fromDateParam === "string") { allBookings = allBookings.filter((b) => b.startTime >= new Date(fromDateParam)); }
  const toDateParam = Array.isArray(toDate) ? toDate[0] : toDate;
  if (toDateParam && typeof toDateParam === "string") { allBookings = allBookings.filter((b) => b.startTime <= new Date(toDateParam + "T23:59:59Z")); }
  allBookings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  const results = await Promise.all(allBookings.map(bookingToResponse));
  res.json(results);
});

// POST /bookings
router.post("/bookings", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const { appointmentTypeId, startTime, endTime, capacity = 1, answers, notes, providerId } = parsed.data;
  const [apt] = await db.select().from(appointmentTypesTable).where(eq(appointmentTypesTable.id, appointmentTypeId)).limit(1);
  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment type not found" });
    return;
  }
  const startDt = new Date(startTime as unknown as string);
  const endDt = new Date(endTime as unknown as string);
  const overlapping = await db.select().from(bookingsTable).where(
    and(
      eq(bookingsTable.appointmentTypeId, appointmentTypeId),
      ne(bookingsTable.status, "cancelled"),
      gte(bookingsTable.startTime, startDt),
      lte(bookingsTable.startTime, endDt)
    )
  );
  if (apt.manageCapacity) {
    const bookedCapacity = overlapping.reduce((sum, b) => sum + (b.capacity || 1), 0);
    if (bookedCapacity + capacity > (apt.maxCapacity || 1)) {
      res.status(409).json({ error: "SlotFull", message: "Not enough capacity for this slot" });
      return;
    }
  } else {
    if (overlapping.length > 0) {
      res.status(409).json({ error: "DoubleBooking", message: "Slot is already booked" });
      return;
    }
  }
  const bookingStatus = apt.manualConfirmation ? "pending" : "confirmed";
  const result = await db.insert(bookingsTable).values({
    appointmentTypeId, customerId: req.user!.id, providerId: providerId || null,
    startTime: startDt, endTime: endDt, status: bookingStatus, capacity,
    paymentStatus: "unpaid", answers: answers as any || [], notes,
  });
  const insertId = Number((result as any)[0].insertId);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, insertId)).limit(1);
  res.status(201).json(await bookingToResponse(booking));
});

// GET /bookings/:bookingId
router.get("/bookings/:bookingId", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.bookingId), 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "NotFound", message: "Booking not found" });
    return;
  }
  if (req.user!.role === "customer" && booking.customerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden", message: "Access denied" });
    return;
  }
  res.json(await bookingToResponse(booking));
});

// PUT /bookings/:bookingId
router.put("/bookings/:bookingId", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.bookingId), 10);
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: parsed.error.message });
    return;
  }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "NotFound", message: "Booking not found" });
    return;
  }
  if (req.user!.role === "customer" && booking.customerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden", message: "Access denied" });
    return;
  }
  const updates: Partial<{ startTime: Date; endTime: Date }> = {};
  if (parsed.data.startTime) updates.startTime = new Date(parsed.data.startTime as unknown as string);
  if (parsed.data.endTime) updates.endTime = new Date(parsed.data.endTime as unknown as string);
  await db.update(bookingsTable).set(updates).where(eq(bookingsTable.id, id));
  const [updated] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  res.json(await bookingToResponse(updated));
});

// POST /bookings/:bookingId/cancel
router.post("/bookings/:bookingId/cancel", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(firstParam(req.params.bookingId), 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "NotFound", message: "Booking not found" });
    return;
  }
  if (req.user!.role === "customer" && booking.customerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden", message: "Access denied" });
    return;
  }
  await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, id));
  const [updated] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  res.json(await bookingToResponse(updated));
});

// POST /bookings/:bookingId/confirm
router.post("/bookings/:bookingId/confirm", requireAuth, async (req: AuthRequest, res) => {
  if (!["organiser", "admin"].includes(req.user!.role)) {
    res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
    return;
  }
  const id = parseInt(firstParam(req.params.bookingId), 10);
  await db.update(bookingsTable).set({ status: "confirmed" }).where(eq(bookingsTable.id, id));
  const [updated] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!updated) {
    res.status(404).json({ error: "NotFound", message: "Booking not found" });
    return;
  }
  res.json(await bookingToResponse(updated));
});

export default router;
