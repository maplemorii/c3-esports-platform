// Prisma 7 config — datasource URL comes from DATABASE_URL env var.
// The CLI auto-loads .env in local dev; in Docker, Railway injects it directly.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
