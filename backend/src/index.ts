import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { swaggerSpec } from './swagger'
import projectsRouter from './routes/projects.routes'

const app = express()
const PORT = process.env.PORT ?? 4000

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.get('/', (_req, res) => {
  res.json({ message: 'Portfolio API is running. See /api-docs for documentation.' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/projects', limiter, projectsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Portfolio API running at http://localhost:${PORT}`)
  console.log(`API docs available at http://localhost:${PORT}/api-docs`)
})
