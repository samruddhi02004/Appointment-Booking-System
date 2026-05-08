import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const businessesTable = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: mysqlEnum("category", [
    "healthcare",
    "beauty_wellness",
    "fitness",
    "education",
    "legal",
    "financial",
    "consulting",
    "automotive",
    "home_services",
    "technology",
    "hospitality",
    "other",
  ]).notNull().default("other"),
  logoUrl: varchar("logo_url", { length: 512 }),
  coverUrl: varchar("cover_url", { length: 512 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 512 }),
  email: varchar("email", { length: 255 }),
  ownerId: int("owner_id")
    .notNull()
    .references(() => usersTable.id),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;

// Business members (staff linked to a business)
export const businessMembersTable = mysqlTable("business_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id")
    .notNull()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["owner", "staff", "admin"]).notNull().default("staff"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertBusinessMemberSchema = createInsertSchema(businessMembersTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertBusinessMember = z.infer<typeof insertBusinessMemberSchema>;
export type BusinessMember = typeof businessMembersTable.$inferSelect;
