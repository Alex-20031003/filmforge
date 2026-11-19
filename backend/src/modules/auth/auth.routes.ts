import { Router } from 'express'
import { validateBody } from '../../middleware/validate-body.middleware.js'
import {
  verifyCodeCheckSchema,
  loginBodySchema,
  sendRecoveryEmailCodeBodySchema,
  newPasswordSchema,
  forgotPasswordBody,
  resetPasswordBody,
  changePasswordBody,
} from './auth.schemas.js'
import {
  completeActivationController,
  getMeController,
  loginController,
  refreshController,
  sendRecoveryEmailCodeController,
  verifyCodeCheckController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
} from './auth.controller.js'
import { requireActivationCredential } from '../../middleware/require-activation-credential.middleware.js'
import { requireAccessToken } from '../../middleware/require-access-token.middleware.js'
import { requireRefreshToken } from '../../middleware/require-refresh-token.middleware.js'
import {
  activationSendRateLimit,
  loginRateLimit,
  resetPasswordRateLimit,
  changePasswordRateLimit,
  forgotPasswordRateLimit,
} from '../../middleware/rate-limit.middleware.js'

export const router = Router()

router.post(
  '/login',
  loginRateLimit,
  validateBody(loginBodySchema),
  loginController,
)
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
router.post('/logout', requireRefreshToken, logoutController)
router.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateBody(forgotPasswordBody),
  forgotPasswordController,
)
router.post(
  '/reset-password',
  resetPasswordRateLimit,
  validateBody(resetPasswordBody),
  resetPasswordController,
)
router.post(
  '/change-password',
  changePasswordRateLimit,
  requireAccessToken,
  validateBody(changePasswordBody),
  changePasswordController,
)
