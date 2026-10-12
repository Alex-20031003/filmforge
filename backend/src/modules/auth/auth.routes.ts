import { Router } from 'express'
import { validateBody } from '../../middleware/validate-body.middleware.js'
import {
  verifyCodeCheckSchema,
  loginBodySchema,
  sendRecoveryEmailCodeBodySchema,
} from './auth.schemas.js'
import {
  loginController,
  sendRecoveryEmailCodeController,
  verifyCodeCheckController,
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
router.post(
  '/activation/verify-email',
  activationSendRateLimit,
  validateBody(verifyCodeCheckSchema),
  requireActivationCredential,
  verifyCodeCheckController,
)
