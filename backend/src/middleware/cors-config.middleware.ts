import cors from 'cors'
import { env } from '../config/env.js'

export const corsConfigMiddleware = cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
})
