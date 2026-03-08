/*
  Warnings:

  - The values [DIVISION_1,DIVISION_2,DIVISION_3,OPEN] on the enum `DivisionTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DivisionTier_new" AS ENUM ('PREMIER', 'CHALLENGERS', 'CONTENDERS');
ALTER TABLE "public"."divisions" ALTER COLUMN "tier" DROP DEFAULT;
ALTER TABLE "divisions" ALTER COLUMN "tier" TYPE "DivisionTier_new" USING ("tier"::text::"DivisionTier_new");
ALTER TYPE "DivisionTier" RENAME TO "DivisionTier_old";
ALTER TYPE "DivisionTier_new" RENAME TO "DivisionTier";
DROP TYPE "public"."DivisionTier_old";
ALTER TABLE "divisions" ALTER COLUMN "tier" SET DEFAULT 'CONTENDERS';
COMMIT;

-- AlterTable
ALTER TABLE "divisions" ALTER COLUMN "tier" SET DEFAULT 'CONTENDERS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT;
