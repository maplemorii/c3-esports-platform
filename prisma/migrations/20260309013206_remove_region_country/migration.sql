/*
  Warnings:

  - You are about to drop the column `country` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "country";

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "region";
