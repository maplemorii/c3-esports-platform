-- AlterTable
ALTER TABLE "teams" ADD COLUMN "inviteToken" TEXT;
ALTER TABLE "teams" ADD COLUMN "inviteExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "teams_inviteToken_key" ON "teams"("inviteToken");
