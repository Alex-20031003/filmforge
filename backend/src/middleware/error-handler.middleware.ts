import type { ErrorRequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!(error instanceof AppError)) {
    req.log.error({ err: error }, 'Unexpected request error')
  }

  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })

    return
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: null,
    },
  })
}
