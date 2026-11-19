import type { RequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'
import { env } from '../config/env.js'

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  const origin = req.get('origin')

  if (origin !== env.FRONTEND_ORIGIN) {
    next(new AppError(403, 'FORBIDDEN', 'Request origin is not allowed'))
    return
  }

  next()
}
