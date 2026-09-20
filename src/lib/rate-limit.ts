import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs);
  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count, updated_at)
    VALUES (${key}, now(), 1, now())
    ON CONFLICT (key) DO UPDATE
    SET
      count = CASE WHEN rate_limits.window_start < ${cutoff} THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < ${cutoff} THEN now() ELSE rate_limits.window_start END,
      updated_at = now()
    RETURNING count
  `);
  return Number(result.rows[0]?.count ?? limit + 1) <= limit;
}
