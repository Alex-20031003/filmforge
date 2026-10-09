import { Router } from 'express'
import { validateBody } from '../../middleware/validate-body.middleware.js'
import {
  loginBodySchema,
  sendRecoveryEmailCodeBodySchema,
} from './auth.schemas.js'
import {
  loginController,
  sendRecoveryEmailCodeController,
} from './auth.controller.js'
import { requireActivationCredential } from '../../middleware/require-activation-credential.middleware.js'
import { activationSendRateLimit } from '../../middleware/activation-send-rate-limit.middleware.js'

export const router = Router()

router.post('/login', validateBody(loginBodySchema), loginController)
router.post(
  '/activation/recovery-email',
  activationSendRateLimit,
  validateBody(sendRecoveryEmailCodeBodySchema),
  requireActivationCredential,
  sendRecoveryEmailCodeController,
)
