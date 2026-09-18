import { randomUUID } from 'node:crypto'
import { pinoHttp } from 'pino-http'
import { logger } from '../lib/logger.js'

export const requestLoggerMiddleware = pinoHttp({
  logger,

  genReqId: (_req, res) => {
    const requestId = randomUUID()

    res.setHeader('X-Request-Id', requestId)

    return requestId
  },

  serializers: {
    req(request) {
      const url = request.url ?? ''
      const queryStart = url.indexOf('?')
      const path = queryStart === -1 ? url : url.slice(0, queryStart)

      return {
        id: request.id,
        method: request.method,
        path,
      }
    },

    res(response) {
      return {
        statusCode: response.statusCode,
      }
    },
  },

  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return 'error'
    }

    if (res.statusCode >= 400) {
      return 'warn'
    }

    return 'info'
  },
})
