-- Migration: add_user_is_blocked
-- Date: 2026-06-30

ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
