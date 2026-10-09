import rateLimit from 'express-rate-limit'
import { AppError } from '../shared/errors/app-error.js'

export const activationSendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Too many requests'))
  },
})
