import { AppError } from '../../shared/errors/app-error.js'
import {
  createActivationSessionRecord,
  createAuthSessionRecord,
  findAuthAccountByUsername,
} from './auth.repository.js'
import type { LoginBody } from './auth.schemas.js'
import argon2 from 'argon2'
import {
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
} from './auth-token.js'

type LoginResult =
  | {
      kind: 'activationRequired'
      activationCredential: string
      expiresAt: Date
    }
  | {
      kind: 'authenticated'
      accessToken: string
      refreshToken: string
      refreshTokenExpiresAt: Date
    }

const ACTIVATION_SESSION_TTL_MS = 15 * 60 * 1000
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const verifyLoginCredentials = async (credentials: LoginBody) => {
  const account = await findAuthAccountByUsername(credentials.username)

  if (!account) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid username or password')
  }

  const passwordMatches = await argon2.verify(
    account.passwordHash,
    credentials.password,
  )

  if (!passwordMatches || account.accountStatus === 'DISABLED') {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid username or password')
  }

  return {
    userId: account.id,
    accountStatus: account.accountStatus,
    mustChangePassword: account.mustChangePassword,
  }
}

export const issueActivationCredential = async (userId: string) => {
  const token = generateOpaqueToken()

  const tokenHash = hashOpaqueToken(token)

  const expiresAt = new Date(Date.now() + ACTIVATION_SESSION_TTL_MS)

  const activationSession = await createActivationSessionRecord({
    userId,
    tokenHash,
    expiresAt,
  })

  return {
    activationCredential: token,
    expiresAt: activationSession.expiresAt,
  }
}

export const issueRefreshCredential = async (userId: string) => {
  const refreshToken = generateOpaqueToken()

  const refreshTokenHash = hashOpaqueToken(refreshToken)

  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_MS)

  const authSession = await createAuthSessionRecord({
    userId,
    refreshTokenHash,
    expiresAt,
  })

  return {
    refreshToken,
    sessionId: authSession.id,
    expiresAt: authSession.expiresAt,
  }
}

export const login = async (credentials: LoginBody): Promise<LoginResult> => {
  const account = await verifyLoginCredentials(credentials)

  if (account.accountStatus === 'PENDING_ACTIVATION') {
    const accountAuthSession = await issueActivationCredential(account.userId)

    return {
      kind: 'activationRequired',
      activationCredential: accountAuthSession.activationCredential,
      expiresAt: accountAuthSession.expiresAt,
    }
  }

  if (account.accountStatus === 'ACTIVE') {
    const accountAuthSession = await issueRefreshCredential(account.userId)

    const accessToken = await signAccessToken(
      account.userId,
      accountAuthSession.sessionId,
    )

    return {
      kind: 'authenticated',
      accessToken,
      refreshToken: accountAuthSession.refreshToken,
      refreshTokenExpiresAt: accountAuthSession.expiresAt,
    }
  }

  throw new AppError(401, 'UNAUTHENTICATED', 'Invalid username or password')
}
