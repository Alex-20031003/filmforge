import express from 'express'
import { router as healthRouter } from './modules/health/health.routes.js'
import { errorHandler } from './middleware/error-handler.middleware.js'
import { notFoundMiddleware } from './middleware/not-found.middleware.js'

export const app = express()

app.use(express.json())

app.use('/health', healthRouter)

app.use(notFoundMiddleware)

app.use(errorHandler)
