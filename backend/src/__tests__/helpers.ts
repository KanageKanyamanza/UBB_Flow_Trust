import express, { type Router } from 'express'
import jwt from 'jsonwebtoken'

export const ADMIN_FIXTURE = {
  id: 'admin-1',
  email: 'admin@trustlane.io',
  firstName: 'Ada',
  lastName: 'Admin',
  isSuperAdmin: false,
}

export const SUPER_ADMIN_FIXTURE = {
  id: 'admin-2',
  email: 'root@trustlane.io',
  firstName: 'Sam',
  lastName: 'Super',
  isSuperAdmin: true,
}

export function makeApp(basePath: string, router: Router) {
  const app = express()
  app.use(express.json())
  app.use(basePath, router)
  return app
}

export function adminToken(adminId = ADMIN_FIXTURE.id, email = ADMIN_FIXTURE.email) {
  return jwt.sign({ adminId, email }, process.env.ADMIN_JWT_SECRET!, { expiresIn: '15m' })
}

export function expiredAdminToken(adminId = ADMIN_FIXTURE.id) {
  return jwt.sign({ adminId, email: ADMIN_FIXTURE.email }, process.env.ADMIN_JWT_SECRET!, { expiresIn: '-10s' })
}

/** Token signed with the *user* app secret — must never pass admin auth. */
export function userToken() {
  return jwt.sign({ userId: 'user-1', email: 'user@org.com' }, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function refreshToken(adminId = ADMIN_FIXTURE.id, email = ADMIN_FIXTURE.email) {
  return jwt.sign({ adminId, email }, process.env.ADMIN_JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}
