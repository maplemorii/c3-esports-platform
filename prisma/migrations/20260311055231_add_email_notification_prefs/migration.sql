-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_notif_disputes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_notif_replays" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_notif_results" BOOLEAN NOT NULL DEFAULT true;
