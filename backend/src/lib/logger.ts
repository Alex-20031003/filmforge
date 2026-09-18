import pino from 'pino'

export const logger = pino({
  name: 'filmforge-api',
  level: 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
})
