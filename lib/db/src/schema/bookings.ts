import {
  mysqlTable,
  int,
  timestamp,
  text,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { appointmentTypesTable } from "./appointments";

export const bookingsTable = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  appointmentTypeId: int("appointment_type_id")
    .notNull()
    .references(() => appointmentTypesTable.id),
  customerId: int("customer_id")
    .notNull()
    .references(() => usersTable.id),
  providerId: int("provider_id").references(() => usersTable.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).notNull().default("pending"),
  capacity: int("capacity").notNull().default(1),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "paid", "refunded"]).notNull().default("unpaid"),
  answers: json("answers").$type<Array<{ questionId: number; question: string; answer: string }>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
