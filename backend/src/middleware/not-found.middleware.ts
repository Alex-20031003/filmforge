import type { RequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'

export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  const error = new AppError(404, 'ROUTE_NOT_FOUND', 'Route not found')

  next(error)
}
