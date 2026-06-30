import 'dotenv/config'
import argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  const firstName = process.env.ADMIN_SEED_FIRSTNAME ?? 'Super'
  const lastName = process.env.ADMIN_SEED_LASTNAME ?? 'Admin'

  if (!email || !password) {
    console.error('Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD in .env')
    process.exit(1)
  }

  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin ${email} already exists — skipping.`)
    return
  }

  const hashed = await argon2.hash(password)
  const admin = await prisma.admin.create({
    data: { email, password: hashed, firstName, lastName, isSuperAdmin: true },
  })

  console.log(`Super admin created: ${admin.email} (id: ${admin.id})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
