import type { RequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'

export const requireActivationCredential: RequestHandler = (req, res, next) => {
  const activationCookie = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('activationCredential='))

  const activationCredential = activationCookie?.slice(
    'activationCredential='.length,
  )

  if (!activationCredential) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid activation credential')
  }

  res.locals.activationCredential = activationCredential
  next()
}
