import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "../db.js";
import { notifyOwner } from "./notification.js";
import { adminProcedure, publicProcedure, router } from "./trpc.js";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(async () => {
      const db = await getDb();
      if (!db) return { ok: false, database: "unavailable" as const };

      try {
        await db.execute(sql`select 1`);
        return { ok: true, database: "connected" as const };
      } catch (error) {
        console.error("[System health] database query failed", error);
        return { ok: false, database: "unavailable" as const };
      }
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
