import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { config } from './config'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { swaggerSpec } from './swagger'
import projectsRouter from './routes/projects.routes'
import authRouter from './routes/auth.routes'

const app = express()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Bonus 3 — security headers (CSP, HSTS, X-Content-Type-Options,
// X-Frame-Options, Referrer-Policy, ...). Also removes X-Powered-By.
app.use(helmet())

// Only the frontend may call this API from a browser, and it may send cookies
// (needed for the httpOnly refresh token).
app.use(cors({ origin: config.frontendUrl, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))
app.use(requestLogger)

app.get('/', (_req, res) => {
  res.json({ message: 'Portfolio API is running. See /api-docs for documentation.' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/auth', authRouter)
app.use('/api/projects', limiter, projectsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Portfolio API running at http://localhost:${config.port}`)
  console.log(`API docs available at http://localhost:${config.port}/api-docs`)
})
