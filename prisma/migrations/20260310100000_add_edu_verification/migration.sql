-- AlterTable
ALTER TABLE "users" ADD COLUMN     "edu_email" TEXT,
ADD COLUMN     "edu_email_verified" TIMESTAMP(3),
ADD COLUMN     "edu_verify_token" TEXT,
ADD COLUMN     "edu_verify_expires" TIMESTAMP(3),
ADD COLUMN     "edu_verify_override" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "edu_verify_note" TEXT;
