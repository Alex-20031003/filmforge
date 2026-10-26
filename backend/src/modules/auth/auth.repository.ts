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

type CompleteActivationInput = {
  activationSessionId: string
  verificationTokenId: string
  userId: string
  recoveryEmail: string
  passwordHash: string
  refreshTokenHash: string
  refreshTokenExpiresAt: Date
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
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          recoveryEmailVerifiedAt: true,
          accountStatus: true,
          recoveryEmail: true,
          passwordHash: true,
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

export const completeActivationRecord = async (
  input: CompleteActivationInput,
) => {
  const completedAt = new Date()

  return prisma.$transaction(async (tx) => {
    const verificationToken = await tx.recoveryEmailVerificationToken.findFirst(
      {
        where: {
          id: input.verificationTokenId,
          userId: input.userId,
          pendingEmail: input.recoveryEmail,
          usedAt: { not: null },
          invalidatedAt: null,
        },
        select: { id: true },
      },
    )

    if (!verificationToken) {
      throw new AppError(409, 'CONFLICT', 'Recovery email is not verified')
    }

    const activationUpdate = await tx.activationSession.updateMany({
      where: {
        id: input.activationSessionId,
        userId: input.userId,
        usedAt: null,
        expiresAt: { gt: completedAt },
      },
      data: { usedAt: completedAt },
    })

    if (activationUpdate.count !== 1) {
      throw new AppError(
        401,
        'UNAUTHENTICATED',
        'Invalid activation credential',
      )
    }

    const accountUpdate = await tx.userAccount.updateMany({
      where: {
        id: input.userId,
        recoveryEmail: input.recoveryEmail,
        recoveryEmailVerifiedAt: { not: null },
        accountStatus: 'PENDING_ACTIVATION',
      },
      data: {
        passwordHash: input.passwordHash,
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    })

    if (accountUpdate.count !== 1) {
      throw new AppError(409, 'CONFLICT', 'Account cannot be activated')
    }

    await tx.activationSession.updateMany({
      where: {
        userId: input.userId,
        usedAt: null,
      },
      data: { usedAt: completedAt },
    })

    await tx.recoveryEmailVerificationToken.updateMany({
      where: {
        userId: input.userId,
        usedAt: null,
        invalidatedAt: null,
      },
      data: { invalidatedAt: completedAt },
    })

    return tx.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.refreshTokenExpiresAt,
      },
      select: {
        id: true,
      },
    })
  })
}

export const findCurrentAuthSession = async (
  userId: string,
  sessionId: string,
) => {
  return prisma.authSession.findFirst({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          accountStatus: true,
          mustChangePassword: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      },
    },
  })
}
