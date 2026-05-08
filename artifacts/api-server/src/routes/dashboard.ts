import { Router } from "express";
import { db, usersTable, bookingsTable, appointmentTypesTable, businessesTable, eq, ne, gte, lte, and, sql } from "@workspace/db";
import { requireRole, requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  const [allUsers, allBookings, allApts, allBusinesses] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(bookingsTable),
    db.select().from(appointmentTypesTable),
    db.select().from(businessesTable),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  res.json({
    totalUsers: allUsers.length,
    totalCustomers: allUsers.filter((u) => u.role === "customer").length,
    totalOrganisers: allUsers.filter((u) => u.role === "organiser").length,
    totalBusinesses: allBusinesses.length,
    totalAppointmentTypes: allApts.length,
    totalBookings: allBookings.length,
    confirmedBookings: allBookings.filter((b) => b.status === "confirmed").length,
    pendingBookings: allBookings.filter((b) => b.status === "pending").length,
    cancelledBookings: allBookings.filter((b) => b.status === "cancelled").length,
    todayBookings: allBookings.filter((b) => b.startTime >= todayStart && b.startTime <= todayEnd).length,
    upcomingBookings: allBookings.filter((b) => b.startTime > now && b.status !== "cancelled").length,
  });
});

// GET /dashboard/peak-hours
router.get("/dashboard/peak-hours", requireAuth, async (req: AuthRequest, res) => {
  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(ne(bookingsTable.status, "cancelled"));

  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;

  allBookings.forEach((b) => {
    const hour = b.startTime.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const result = Object.entries(hourCounts).map(([hour, count]) => {
    const h = parseInt(hour);
    const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
    return { hour: h, bookingCount: count, label };
  });

  res.json(result);
});

// GET /dashboard/provider-utilization
router.get("/dashboard/provider-utilization", requireAuth, async (req: AuthRequest, res) => {
  const organisers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "organiser"));

  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(ne(bookingsTable.status, "cancelled"));

  const result = await Promise.all(
    organisers.map(async (organiser) => {
      const myApts = await db
        .select()
        .from(appointmentTypesTable)
        .where(eq(appointmentTypesTable.organiserId, organiser.id));

      const myAptIds = myApts.map((a) => a.id);
      const myBookings = allBookings.filter((b) => myAptIds.includes(b.appointmentTypeId));

      // Estimate total slots: each appointment type with working hours × 5 days × slots per day
      let totalSlots = myApts.length * 20; // rough estimate
      const bookedSlots = myBookings.length;
      const utilizationPercent =
        totalSlots > 0 ? Math.min(100, Math.round((bookedSlots / totalSlots) * 100)) : 0;

      return {
        providerId: organiser.id,
        providerName: organiser.fullName,
        totalSlots,
        bookedSlots,
        utilizationPercent,
      };
    })
  );

  res.json(result);
});

// GET /dashboard/recent-bookings
router.get("/dashboard/recent-bookings", requireAuth, async (req: AuthRequest, res) => {
  const limit = parseInt((req.query.limit as string) || "10");

  const allBookings = await db.select().from(bookingsTable);
  allBookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const recent = allBookings.slice(0, Math.min(limit, 50));

  const results = await Promise.all(
    recent.map(async (booking) => {
      const [apt] = await db
        .select()
        .from(appointmentTypesTable)
        .where(eq(appointmentTypesTable.id, booking.appointmentTypeId))
        .limit(1);

      const [customer] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, booking.customerId))
        .limit(1);

      const userToObj = (u: typeof usersTable.$inferSelect) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt.toISOString(),
      });

      return {
        id: booking.id,
        appointmentTypeId: booking.appointmentTypeId,
        appointmentType: apt
          ? {
              id: apt.id,
              title: apt.title,
              duration: apt.duration,
              isPublished: apt.isPublished,
              scheduleType: apt.scheduleType,
              manageCapacity: apt.manageCapacity,
              advancePayment: apt.advancePayment,
              manualConfirmation: apt.manualConfirmation,
              assignmentType: apt.assignmentType,
              createdAt: apt.createdAt.toISOString(),
            }
          : undefined,
        customerId: booking.customerId,
        customer: customer ? userToObj(customer) : undefined,
        providerId: booking.providerId,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        capacity: booking.capacity,
        paymentStatus: booking.paymentStatus,
        answers: booking.answers || [],
        notes: booking.notes,
        createdAt: booking.createdAt.toISOString(),
      };
    })
  );

  res.json(results);
});

export default router;
