import express from 'express'
import { router as healthRouter } from './modules/health/health.routes.js'

export const app = express()

app.use(express.json())

app.use('/health', healthRouter)
