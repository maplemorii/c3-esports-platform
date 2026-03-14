-- AlterTable: add email verification token fields and TOTP 2FA fields to users
ALTER TABLE "users" ADD COLUMN "email_verify_token"   TEXT;
ALTER TABLE "users" ADD COLUMN "email_verify_expires"  TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "two_factor_secret"     TEXT;
ALTER TABLE "users" ADD COLUMN "two_factor_enabled"    BOOLEAN NOT NULL DEFAULT false;
