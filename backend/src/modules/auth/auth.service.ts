import { AppError } from '../../shared/errors/app-error.js'
import {
  completeActivationRecord,
  createActivationSessionRecord,
  createAuthSessionRecord,
  findActivationSessionByTokenHash,
  findAuthAccountByUsername,
  findCurrentAuthSession,
  findLatestRecoveryEmailVerificationToken,
  findVerifyCodeByUserId,
  markRecoveryEmailVerified,
  recordFailedCodeAttempt,
  replaceRecoveryEmailVerificationToken,
} from './auth.repository.js'
import type { LoginBody } from './auth.schemas.js'
import argon2 from 'argon2'
import {
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
} from './auth-token.js'
import { randomInt } from 'node:crypto'
import { sendActivationCodeEmail } from '../../lib/mail.js'

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

export const sendRecoveryEmailCode = async (activationCredential: string) => {
  const activationCredentialHash = hashOpaqueToken(activationCredential)
  const activationSession = await findActivationSessionByTokenHash(
    activationCredentialHash,
  )

  if (
    !activationSession ||
    activationSession.expiresAt.getTime() <= Date.now() ||
    activationSession.user.accountStatus !== 'PENDING_ACTIVATION' ||
    activationSession.usedAt !== null
  ) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid activation credential')
  }

  const latestToken = await findLatestRecoveryEmailVerificationToken(
    activationSession.userId,
  )

  const resendCooldownMs = 60 * 1000

  if (
    latestToken &&
    Date.now() - latestToken.createdAt.getTime() < resendCooldownMs
  ) {
    throw new AppError(
      429,
      'TOO_MANY_REQUESTS',
      'Please wait before requesting another code',
    )
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const codeHash = await argon2.hash(code)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await replaceRecoveryEmailVerificationToken({
    userId: activationSession.userId,
    pendingEmail: activationSession.user.recoveryEmail,
    tokenHash: codeHash,
    expiresAt,
  })

  await sendActivationCodeEmail(activationSession.user.recoveryEmail, code)
}

export const verifyCodeCheck = async (
  code: string,
  activationCredential: string,
) => {
  const activationCredentialHash = hashOpaqueToken(activationCredential)
  const activationSession = await findActivationSessionByTokenHash(
    activationCredentialHash,
  )

  if (
    !activationSession ||
    activationSession.expiresAt.getTime() <= Date.now() ||
    activationSession.user.accountStatus !== 'PENDING_ACTIVATION' ||
    activationSession.usedAt !== null
  ) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid activation credential')
  }

  const verificationToken = await findVerifyCodeByUserId(
    activationSession.userId,
  )

  if (
    !verificationToken ||
    verificationToken.pendingEmail !== activationSession.user.recoveryEmail ||
    verificationToken.expiresAt.getTime() <= Date.now() ||
    verificationToken.invalidatedAt !== null ||
    verificationToken.usedAt !== null ||
    verificationToken.failedAttempts >= 5
  ) {
    throw new AppError(
      400,
      'BAD_REQUEST',
      'Invalid or expired verification code',
    )
  }

  const codesMatch = await argon2.verify(verificationToken.tokenHash, code)

  if (!codesMatch) {
    await recordFailedCodeAttempt(
      verificationToken.id,
      verificationToken.failedAttempts,
    )

    throw new AppError(400, 'BAD_REQUEST', 'Invalid verification code')
  }

  await markRecoveryEmailVerified(
    verificationToken.id,
    activationSession.userId,
    verificationToken.pendingEmail,
  )
}

export const completeActivation = async (
  newPassword: string,
  activationCredential: string,
) => {
  const activactionCredentialHash = hashOpaqueToken(activationCredential)
  const activationSession = await findActivationSessionByTokenHash(
    activactionCredentialHash,
  )

  if (
    !activationSession ||
    activationSession.expiresAt.getTime() <= Date.now() ||
    activationSession.usedAt !== null ||
    activationSession.user.accountStatus !== 'PENDING_ACTIVATION'
  ) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid activation credential')
  }

  const verificationToken = await findVerifyCodeByUserId(
    activationSession.userId,
  )

  if (
    activationSession.user.recoveryEmailVerifiedAt === null ||
    !verificationToken ||
    verificationToken.pendingEmail !== activationSession.user.recoveryEmail ||
    verificationToken.usedAt === null ||
    verificationToken.invalidatedAt !== null
  ) {
    throw new AppError(409, 'CONFLICT', 'Recovery email is not verified')
  }

  const samePassword = await argon2.verify(
    activationSession.user.passwordHash,
    newPassword,
  )

  if (samePassword) {
    throw new AppError(
      400,
      'BAD_REQUEST',
      'New password must differ from the current password',
    )
  }

  const passwordHash = await argon2.hash(newPassword)

  const refreshToken = generateOpaqueToken()
  const refreshTokenHash = hashOpaqueToken(refreshToken)
  const refreshTokenExpiresAt = new Date(Date.now() + AUTH_SESSION_TTL_MS)

  const authSession = await completeActivationRecord({
    activationSessionId: activationSession.id,
    verificationTokenId: verificationToken.id,
    userId: activationSession.userId,
    recoveryEmail: activationSession.user.recoveryEmail,
    passwordHash,
    refreshTokenHash,
    refreshTokenExpiresAt,
  })

  const accessToken = await signAccessToken(
    activationSession.userId,
    authSession.id,
  )

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
  }
}

export const getMe = async (userId: string, sessionId: string) => {
  const authSession = await findCurrentAuthSession(userId, sessionId)

  if (authSession === null || authSession.user.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session')
  }

  return {
    id: authSession.user.id,
    username: authSession.user.username,
    mustChangePassword: authSession.user.mustChangePassword,
    profile: authSession.user.profile,
  }
}
