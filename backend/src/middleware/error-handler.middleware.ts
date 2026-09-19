import type { ErrorRequestHandler } from 'express'
import { AppError } from '../shared/errors/app-error.js'

type MalformedJsonError = SyntaxError & {
  status: 400
  type: 'entity.parse.failed'
}

const isMalformedJsonError = (error: unknown): error is MalformedJsonError => {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  )
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const malformedJson = isMalformedJsonError(error)

  if (!(error instanceof AppError) && !malformedJson) {
    req.log.error({ err: error }, 'Unexpected request error')
  }

  if (res.headersSent) {
    next(error)
    return
  }

  if (malformedJson) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
        details: null,
      },
    })

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
