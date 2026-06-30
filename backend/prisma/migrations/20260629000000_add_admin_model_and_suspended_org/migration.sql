-- Migration: add_admin_model_and_suspended_org
-- Date: 2026-06-29

-- Add isSuspended to Organization
ALTER TABLE "Organization" ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false;

-- Create Admin table
CREATE TABLE "Admin" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "password"     TEXT NOT NULL,
    "firstName"    TEXT NOT NULL,
    "lastName"     TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "refreshToken" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- Make orgId nullable on AuditLog (admin actions don't belong to an org)
ALTER TABLE "AuditLog" ALTER COLUMN "orgId" DROP NOT NULL;

-- Add adminId to AuditLog
ALTER TABLE "AuditLog" ADD COLUMN "adminId" TEXT;

CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- Foreign key: AuditLog.adminId -> Admin.id
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
