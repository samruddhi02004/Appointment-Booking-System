import { Router } from "express";
import { db, appointmentTypesTable, bookingsTable, usersTable, eq, and, gte, lte, ne } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

function firstParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

// GET /appointments/:appointmentId/slots?date=YYYY-MM-DD&providerId=N
router.get("/appointments/:appointmentId/slots", requireAuth, async (req, res) => {
  const appointmentId = parseInt(firstParam(req.params.appointmentId), 10);
  const { date, providerId } = req.query;

  if (!date || typeof date !== "string") {
    res.status(400).json({ error: "ValidationError", message: "date query param required (YYYY-MM-DD)" });
    return;
  }

  const [apt] = await db
    .select()
    .from(appointmentTypesTable)
    .where(eq(appointmentTypesTable.id, appointmentId))
    .limit(1);

  if (!apt) {
    res.status(404).json({ error: "NotFound", message: "Appointment type not found" });
    return;
  }

  const dayDate = new Date(date + "T00:00:00.000Z");
  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase() as
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

  const workingHours = apt.workingHours as Record<
    string,
    { enabled: boolean; startTime: string; endTime: string }
  > | null;

  const daySchedule = workingHours?.[dayName];

  if (!daySchedule?.enabled) {
    res.json([]);
    return;
  }

  const [startHour, startMin] = daySchedule.startTime.split(":").map(Number);
  const [endHour, endMin] = daySchedule.endTime.split(":").map(Number);

  const dayStart = new Date(date + "T00:00:00.000Z");
  dayStart.setUTCHours(startHour, startMin, 0, 0);

  const dayEnd = new Date(date + "T00:00:00.000Z");
  dayEnd.setUTCHours(endHour, endMin, 0, 0);

  const durationMs = apt.duration * 60 * 1000;
  const slots = [];
  let current = new Date(dayStart);

  // Get existing bookings for this day
  const existingBookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.appointmentTypeId, appointmentId),
        ne(bookingsTable.status, "cancelled"),
        gte(bookingsTable.startTime, dayStart),
        lte(bookingsTable.startTime, dayEnd)
      )
    );

  while (current.getTime() + durationMs <= dayEnd.getTime()) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + durationMs);

    // Count bookings in this slot
    const slotBookings = existingBookings.filter(
      (b) =>
        b.startTime.getTime() >= slotStart.getTime() &&
        b.startTime.getTime() < slotEnd.getTime() &&
        (!providerId || b.providerId === parseInt(providerId as string))
    );

    const bookedCapacity = slotBookings.reduce((sum, b) => sum + (b.capacity || 1), 0);
    const maxCap = apt.manageCapacity ? (apt.maxCapacity || 1) : 1;
    const remainingCapacity = maxCap - bookedCapacity;
    const available = remainingCapacity > 0;

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available,
      remainingCapacity: Math.max(0, remainingCapacity),
      providerId: providerId ? parseInt(providerId as string) : undefined,
    });

    current = new Date(current.getTime() + durationMs);
  }

  res.json(slots);
});

export default router;
