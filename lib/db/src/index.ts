import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
export { and, count, eq, gte, inArray, like, lte, ne, sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL || "mysql://root:root@localhost:3307/bookslot";

export const pool = mysql.createPool(databaseUrl);
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
