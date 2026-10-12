import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/app-error.js'

type CreateActivationSessionInput = {
  userId: string
  tokenHash: string
  expiresAt: Date
}

type CreateAuthSessionInput = {
  userId: string
  refreshTokenHash: string
  expiresAt: Date
}

type replaceRecoveryEmailVerificationTokenInput = {
  userId: string
  pendingEmail: string
  tokenHash: string
  expiresAt: Date
}

export const findAuthAccountByUsername = async (username: string) => {
  const account = await prisma.userAccount.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      passwordHash: true,
      accountStatus: true,
      mustChangePassword: true,
    },
  })

  return account
}

export const createActivationSessionRecord = async (
  input: CreateActivationSessionInput,
) => {
  const activationSession = await prisma.activationSession.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  })

  return activationSession
}

export const createAuthSessionRecord = async (
  input: CreateAuthSessionInput,
) => {
  const authSession = await prisma.authSession.create({
    data: {
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  })

  return authSession
}

export const findActivationSessionByTokenHash = async (tokenHash: string) => {
  const activationSession = prisma.activationSession.findUnique({
    where: {
      tokenHash,
    },
    select: {
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          accountStatus: true,
          recoveryEmail: true,
        },
      },
    },
  })

  return activationSession
}

export const findLatestRecoveryEmailVerificationToken = async (
  userId: string,
) => {
  return prisma.recoveryEmailVerificationToken.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
}

export const replaceRecoveryEmailVerificationToken = async (
  input: replaceRecoveryEmailVerificationTokenInput,
) => {
  const invalidatedAt = new Date()

  return prisma.$transaction(async (tx) => {
    await tx.recoveryEmailVerificationToken.updateMany({
      where: {
        userId: input.userId,
        usedAt: null,
        invalidatedAt: null,
      },
      data: {
        invalidatedAt,
      },
    })

    return tx.recoveryEmailVerificationToken.create({
      data: {
        userId: input.userId,
        pendingEmail: input.pendingEmail,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })
  })
}

export const findVerifyCodeByUserId = async (userId: string) => {
  const activationSession = prisma.recoveryEmailVerificationToken.findFirst({
    where: {
      userId,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tokenHash: true,
      pendingEmail: true,
      expiresAt: true,
      failedAttempts: true,
      invalidatedAt: true,
      usedAt: true,
    },
  })

  return activationSession
}

export const recordFailedCodeAttempt = async (
  tokenId: string,
  failedAttempts: number,
) => {
  await prisma.recoveryEmailVerificationToken.update({
    where: { id: tokenId },
    data: {
      failedAttempts: { increment: 1 },
      ...(failedAttempts === 4 ? { invalidatedAt: new Date() } : {}),
    },
  })
}

export const markRecoveryEmailVerified = async (
  tokenId: string,
  userId: string,
  pendingEmail: string,
) => {
  const verifiedAt = new Date()

  await prisma.$transaction(async (tx) => {
    const tokenUpdate = await tx.recoveryEmailVerificationToken.updateMany({
      where: {
        id: tokenId,
        userId,
        pendingEmail,
        expiresAt: { gt: verifiedAt },
        failedAttempts: { lt: 5 },
        invalidatedAt: null,
        usedAt: null,
      },
      data: { usedAt: verifiedAt },
    })

    if (tokenUpdate.count !== 1) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'Invalid or expired verification code',
      )
    }

    const accountUpdate = await tx.userAccount.updateMany({
      where: {
        id: userId,
        recoveryEmail: pendingEmail,
        accountStatus: 'PENDING_ACTIVATION',
      },
      data: { recoveryEmailVerifiedAt: verifiedAt },
    })

    if (accountUpdate.count !== 1) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'Invalid or expired verification code',
      )
    }
  })
}
