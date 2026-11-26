import type { RequestHandler } from 'express'
import { type ZodType, flattenError } from 'zod'
import { AppError } from '../shared/errors/app-error.js'

export const validateBody = (schema: ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const error = new AppError(
        400,
        'BAD_REQUEST',
        'Request validation failed',
        flattenError(result.error),
      )

      next(error)
      return
    }

    req.body = result.data

    next()
  }
}

export const validateQuery = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    console.log({
      page: req.query.page,
      limit: req.query.limit,
    })

    const result = schema.safeParse(req.query)

    if (!result.success) {
      const error = new AppError(
        400,
        'BAD_REQUEST',
        'Request validation failed',
        flattenError(result.error),
      )

      next(error)
      return
    }

    res.locals.validatedQuery = result.data

    next()
  }
}

export const validateParams = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params)

    if (!result.success) {
      const error = new AppError(
        400,
        'BAD_REQUEST',
        'Request validation failed',
        flattenError(result.error),
      )

      next(error)
      return
    }

    res.locals.validatedParams = result.data
    next()
  }
}
