import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { validateContentType, sanitizeBody } from './middleware/security.middleware.js'
import authRoutes from './routes/auth.routes.js'
import accountRoutes from './routes/account.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import budgetRoutes from './routes/budget.routes.js'
import recurringRuleRoutes from './routes/recurring-rule.routes.js'
import alertRoutes from './routes/alert.routes.js'
import profileRoutes from './routes/profile.routes.js'
import documentRoutes from './routes/document.routes.js'
import trustRoutes from './routes/trust.routes.js'
import complianceRoutes from './routes/compliance.routes.js'
import consentGrantRoutes from './routes/consent-grant.routes.js'
import partnerRoutes from './routes/partner.routes.js'
import publicProfileRoutes from './routes/public-profile.routes.js'
import exportRoutes from './routes/export.routes.js'
import pushRoutes from './routes/push.routes.js'
import adminAuthRoutes from './routes/admin/admin-auth.routes.js'
import adminOrgsRoutes from './routes/admin/admin-orgs.routes.js'
import adminUsersRoutes from './routes/admin/admin-users.routes.js'
import adminAdminsRoutes from './routes/admin/admin-admins.routes.js'
import adminDocumentsRoutes from './routes/admin/admin-documents.routes.js'
import adminTrustRoutes from './routes/admin/admin-trust.routes.js'
import adminComplianceRoutes from './routes/admin/admin-compliance.routes.js'
import { scoreQueue } from './services/score-queue.service.js'
import { CronService } from './services/cron.service.js'
import { PushService } from './services/push.service.js'

const app = express()
const port = process.env.PORT || 5000

// Rate limiting : Auth routes (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
})

// Rate limiting : Global API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez patienter.' }
})

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://ubb-flow-trust-frontend.vercel.app',
  'https://www.ubb-flow-trust-frontend.vercel.app',
  'https://www.trust-lane.app',
  'https://trust-lane.app',
]

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true
}))

// Helmet renforcé
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// Headers de sécurité additionnels
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

// Rate limiters
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)
app.use('/api/admin/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
}))
app.use(limiter)

// Security middlewares
app.use(validateContentType)
app.use(sanitizeBody)

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/organizations', adminOrgsRoutes)
app.use('/api/admin/users', adminUsersRoutes)
app.use('/api/admin/admins', adminAdminsRoutes)
app.use('/api/admin/documents', adminDocumentsRoutes)
app.use('/api/admin/trust-scores', adminTrustRoutes)
app.use('/api/admin/compliance', adminComplianceRoutes)

// Routes
app.use('/auth', authRoutes)
app.use('/accounts', accountRoutes)
app.use('/transactions', transactionRoutes)
app.use('/upload', uploadRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/budgets', budgetRoutes)
app.use('/recurring-rules', recurringRuleRoutes)
app.use('/alerts', alertRoutes)
app.use('/profile', profileRoutes)
app.use('/documents', documentRoutes)
app.use('/trust', trustRoutes)
app.use('/compliance', complianceRoutes)
app.use('/consent-grants', consentGrantRoutes)
app.use('/partner', partnerRoutes)
app.use('/public', publicProfileRoutes)
app.use('/api/export', exportRoutes)
app.use('/export', exportRoutes)
app.use('/push', pushRoutes)

// Serve local static uploads if STORAGE_TYPE=local
if (process.env.STORAGE_TYPE === 'local' || !process.env.STORAGE_TYPE) {
  const uploadPath = path.join(process.cwd(), 'uploads')
  app.use('/uploads', express.static(uploadPath))
  console.log(`[storage]: Serving local files from ${uploadPath}`)
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    scoreQueue: scoreQueue.getStats()
  })
})

// Initialize Cron Jobs
CronService.init()

// Configure Web Push (VAPID)
PushService.configure()

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

