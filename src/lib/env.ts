import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (url) => url.startsWith("file:") || url.startsWith("postgresql"),
      "DATABASE_URL must be a SQLite file: URL or PostgreSQL connection string",
    ),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Validates required server env vars. Call from API routes or server code that needs the DB. */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.flatten().fieldErrors}`,
    );
  }
  return parsed.data;
}
