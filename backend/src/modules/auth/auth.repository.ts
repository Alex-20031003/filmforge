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
