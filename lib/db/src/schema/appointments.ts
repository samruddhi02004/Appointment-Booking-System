import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { businessesTable } from "./businesses";

export const appointmentTypesTable = mysqlTable("appointment_types", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id")
    .notNull()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  duration: int("duration").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  scheduleType: mysqlEnum("schedule_type", ["weekly", "flexible"]).notNull().default("weekly"),
  manageCapacity: boolean("manage_capacity").notNull().default(false),
  maxCapacity: int("max_capacity").default(1),
  advancePayment: boolean("advance_payment").notNull().default(false),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  manualConfirmation: boolean("manual_confirmation").notNull().default(false),
  assignmentType: mysqlEnum("assignment_type", ["auto", "manual"]).notNull().default("auto"),
  location: varchar("location", { length: 500 }),
  resourceType: mysqlEnum("resource_type", ["user", "resource"]).notNull().default("user"),
  workingHours: json("working_hours"),
  organiserId: int("organiser_id")
    .notNull()
    .references(() => usersTable.id),
  shareToken: varchar("share_token", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const insertAppointmentTypeSchema = createInsertSchema(appointmentTypesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointmentType = z.infer<typeof insertAppointmentTypeSchema>;
export type AppointmentType = typeof appointmentTypesTable.$inferSelect;

export const questionsTable = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointment_id")
    .notNull()
    .references(() => appointmentTypesTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionType: mysqlEnum("question_type", ["text", "select", "checkbox", "radio"]).notNull().default("text"),
  isRequired: boolean("is_required").notNull().default(false),
  options: json("options").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
