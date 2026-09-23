import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../shared/errors/app-error.js'

export const validateBody = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const error = new AppError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed',
        z.flattenError(result.error),
      )

      next(error)
      return
    }

    req.body = result.data

    next()
  }
}
