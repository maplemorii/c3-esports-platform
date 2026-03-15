-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "ScheduleMode" AS ENUM ('FULL_RR', 'PARTIAL_RR', 'DOUBLE_RR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable players: add trackerUrl
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "trackerUrl" TEXT;

-- AlterTable divisions: add scheduleMode and scheduleGeneratedAt
ALTER TABLE "divisions" ADD COLUMN IF NOT EXISTS "scheduleMode" "ScheduleMode";
ALTER TABLE "divisions" ADD COLUMN IF NOT EXISTS "scheduleGeneratedAt" TIMESTAMP(3);
