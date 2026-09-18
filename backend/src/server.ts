import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'

const PORT = env.PORT

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})
