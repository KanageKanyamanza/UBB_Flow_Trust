import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

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
app.use('/auth', authRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
