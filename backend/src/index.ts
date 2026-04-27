import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import path from 'path'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// Configuration du rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
  standardHeaders: 'draft-7', // Retourne les informations de limite dans les headers `RateLimit`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
})

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(limiter)

// Routes
import authRoutes from './routes/auth.routes.js'
import accountRoutes from './routes/account.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import budgetRoutes from './routes/budget.routes.js'
import recurringRuleRoutes from './routes/recurring-rule.routes.js'

app.use('/auth', authRoutes)
app.use('/accounts', accountRoutes)
app.use('/transactions', transactionRoutes)
app.use('/upload', uploadRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/budgets', budgetRoutes)
app.use('/recurring-rules', recurringRuleRoutes)

// Serve local static uploads if STORAGE_TYPE=local
if (process.env.STORAGE_TYPE === 'local' || !process.env.STORAGE_TYPE) {
  const uploadPath = path.join(process.cwd(), 'uploads')
  app.use('/uploads', express.static(uploadPath))
  console.log(`[storage]: Serving local files from ${uploadPath}`)
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
