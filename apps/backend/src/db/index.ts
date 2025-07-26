import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export function createDb() {
  const url = process.env.DATABASE_URL!;

  const conn = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    // transform: postgres.camel,
  });

  return drizzle(conn, { schema });
}
