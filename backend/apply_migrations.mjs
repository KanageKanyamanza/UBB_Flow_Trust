import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_smIelk5HJB1f@ep-silent-sky-abggpplu-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

const migrations = [
  {
    name: 'add_push_subscription',
    sql: `
      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
      CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
      ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
      ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `
  },
  {
    name: 'add_admin_model',
    sql: `
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id"           TEXT NOT NULL,
        "email"        TEXT NOT NULL,
        "password"     TEXT NOT NULL,
        "firstName"    TEXT NOT NULL,
        "lastName"     TEXT NOT NULL,
        "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
        "refreshToken" TEXT,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");
      ALTER TABLE "AuditLog" ALTER COLUMN "orgId" DROP NOT NULL;
      ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "adminId" TEXT;
      CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");
      ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_adminId_fkey";
      ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `
  },
]

for (const m of migrations) {
  try {
    await pool.query(m.sql)
    console.log(`✓ ${m.name}`)
  } catch (e) {
    console.error(`✗ ${m.name}: ${e.message}`)
  }
}

pool.end()
