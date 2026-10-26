import type { RequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'
import { verifyAccessToken } from '../modules/auth/auth-token.js'

export const requireAccessToken: RequestHandler = async (req, res, next) => {
  const accessCookie = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('accessToken='))

  const accessToken = accessCookie?.slice('accessToken='.length)

  if (!accessToken) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired access token')
  }

  const auth = await verifyAccessToken(accessToken)

  res.locals.auth = auth
  next()
}
