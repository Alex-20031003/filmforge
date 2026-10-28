import { Router } from 'express'
import { validateBody } from '../../middleware/validate-body.middleware.js'
import {
  verifyCodeCheckSchema,
  loginBodySchema,
  sendRecoveryEmailCodeBodySchema,
  newPasswordSchema,
} from './auth.schemas.js'
import {
  completeActivationController,
  getMeController,
  loginController,
  refreshController,
  sendRecoveryEmailCodeController,
  verifyCodeCheckController,
} from './auth.controller.js'
import { requireActivationCredential } from '../../middleware/require-activation-credential.middleware.js'
import { activationSendRateLimit } from '../../middleware/activation-send-rate-limit.middleware.js'
import { requireAccessToken } from '../../middleware/require-access-token.middleware.js'
import { requireRefreshToken } from '../../middleware/require-refresh-token.middleware.js'

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
router.post(
  '/activation/complete',
  validateBody(newPasswordSchema),
  requireActivationCredential,
  completeActivationController,
)
router.get('/me', requireAccessToken, getMeController)

router.post('/refresh', requireRefreshToken, refreshController)
