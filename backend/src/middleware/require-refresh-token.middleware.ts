import type { RequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'

export const requireRefreshToken: RequestHandler = async (req, res, next) => {
  const refreshCookie = (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('refreshToken='))

  const refreshToken = refreshCookie?.slice('refreshToken='.length)

  if (!refreshToken) {
    throw new AppError(
      401,
      'UNAUTHENTICATED',
      'Invalid or expired refresh token',
    )
  }

  res.locals.refreshToken = refreshToken

  next()
}
