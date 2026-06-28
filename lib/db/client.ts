import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Lazily build the Drizzle client. Initialized on first use (request time) rather
 * than at import, so route modules stay importable during `next build` even
 * before DATABASE_URL is present. Neon's HTTP driver is stateless — each query is
 * a fetch, so there's no pool to manage in serverless.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — provision a Postgres database first.");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
