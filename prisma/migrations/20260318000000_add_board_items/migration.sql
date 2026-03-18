-- CreateEnum
CREATE TYPE "BoardItemType" AS ENUM ('FEATURE', 'BUG', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "BoardItemStatus" AS ENUM ('PLANNED', 'IN_DEVELOPMENT', 'COMPLETED');

-- CreateTable
CREATE TABLE "board_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "BoardItemType" NOT NULL DEFAULT 'FEATURE',
    "status" "BoardItemStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_items_status_priority_idx" ON "board_items"("status", "priority");
