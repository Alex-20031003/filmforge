import type { RequestHandler } from 'express'
import { login } from './auth.service.js'
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
