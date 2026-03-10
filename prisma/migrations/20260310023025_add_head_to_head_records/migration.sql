-- CreateTable
CREATE TABLE "head_to_head_records" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "head_to_head_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "head_to_head_records_divisionId_teamId_idx" ON "head_to_head_records"("divisionId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "head_to_head_records_divisionId_teamId_opponentId_key" ON "head_to_head_records"("divisionId", "teamId", "opponentId");

-- AddForeignKey
ALTER TABLE "head_to_head_records" ADD CONSTRAINT "head_to_head_records_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "head_to_head_records" ADD CONSTRAINT "head_to_head_records_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "head_to_head_records" ADD CONSTRAINT "head_to_head_records_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
