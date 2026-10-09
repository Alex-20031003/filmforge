import { prisma } from '../../lib/prisma.js'

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
