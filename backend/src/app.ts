import express from 'express'
import { router as healthRouter } from './modules/health/health.routes.js'
import { router as authRouter } from './modules/auth/auth.routes.js'
import { router as employeesRouter } from './modules/employees/employees.routes.js'
import { errorHandler } from './middleware/error-handler.middleware.js'
import { notFoundMiddleware } from './middleware/not-found.middleware.js'
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js'
import helmet from 'helmet'
import { corsConfigMiddleware } from './middleware/cors-config.middleware.js'
import { requireTrustedOrigin } from './middleware/require-trusted-origin.middleware.js'

export const app = express()

app.use(requestLoggerMiddleware)

app.use(helmet())

app.use(corsConfigMiddleware)

app.use(requireTrustedOrigin)

app.use(express.json())

app.use('/health', healthRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/employees', employeesRouter)

app.use(notFoundMiddleware)

app.use(errorHandler)
