import type { RequestHandler } from 'express'
import {
  completeActivation,
  getMe,
  login,
  logoutSession,
  refreshSession,
  sendRecoveryEmailCode,
  verifyCodeCheck,
} from './auth.service.js'
import { env } from '../../config/env.js'

export const loginController: RequestHandler = async (req, res) => {
  const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000

  const loginResult = await login(req.body)

  if (loginResult.kind === 'activationRequired') {
    res.cookie('activationCredential', loginResult.activationCredential, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      expires: loginResult.expiresAt,
      path: '/api/v1/auth/activation',
    })

    res.status(200).json({
      data: {
        kind: loginResult.kind,
      },
    })

    return
  }

  if (loginResult.kind === 'authenticated') {
    res.cookie('accessToken', loginResult.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/api/v1',
      maxAge: ACCESS_TOKEN_TTL_MS,
    })

    res.cookie('refreshToken', loginResult.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/api/v1/auth',
      expires: loginResult.refreshTokenExpiresAt,
    })

    res.status(200).json({
      data: {
        kind: loginResult.kind,
      },
    })

    return
  }
}

export const sendRecoveryEmailCodeController: RequestHandler = async (
  _req,
  res,
) => {
  const activationCredential = res.locals.activationCredential

  await sendRecoveryEmailCode(activationCredential)

  res.status(200).json({
    data: {},
  })
}

export const verifyCodeCheckController: RequestHandler = async (req, res) => {
  const activationCredential = res.locals.activationCredential
  const verifyCode = req.body.code

  await verifyCodeCheck(verifyCode, activationCredential)

  res.status(200).json({
    data: {},
  })
}

export const completeActivationController: RequestHandler = async (
  req,
  res,
) => {
  const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000

  const activationCredential = res.locals.activationCredential
  const newPassword = req.body.newPassword

  const result = await completeActivation(newPassword, activationCredential)

  res.clearCookie('activationCredential', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth/activation',
  })

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1',
    maxAge: ACCESS_TOKEN_TTL_MS,
  })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth',
    expires: result.refreshTokenExpiresAt,
  })

  res.status(200).json({
    data: {
      kind: 'authenticated',
    },
  })
}

export const getMeController: RequestHandler = async (_req, res) => {
  const { userId, sessionId } = res.locals.auth

  const result = await getMe(userId, sessionId)

  res.status(200).json({ data: result })
}

export const refreshController: RequestHandler = async (_req, res) => {
  const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000

  const refreshToken = res.locals.refreshToken

  const result = await refreshSession(refreshToken)

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1',
    maxAge: ACCESS_TOKEN_TTL_MS,
  })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth',
    expires: result.refreshTokenExpiresAt,
  })

  res.status(200).json({
    data: {
      kind: 'authenticated',
    },
  })
}

export const logoutController: RequestHandler = async (_req, res) => {
  const refreshToken = res.locals.refreshToken

  await logoutSession(refreshToken)

  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1',
  })

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth',
  })

  res.status(200).json({ data: {} })
}
