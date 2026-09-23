import { AppError } from '../../shared/errors/app-error.js'
import { findAuthAccountByUsername } from './auth.repository.js'
import type { LoginBody } from './auth.schemas.js'
import argon2 from 'argon2'

export const verifyLoginCredentials = async (credentials: LoginBody) => {
  const account = await findAuthAccountByUsername(credentials.username)

  if (!account) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid username or password',
    )
  }

  const passwordMatches = await argon2.verify(
    account.passwordHash,
    credentials.password,
  )

  if (!passwordMatches || account.accountStatus === 'DISABLED') {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid username or password',
    )
  }

  return {
    userId: account.id,
    accountStatus: account.accountStatus,
    mustChangePassword: account.mustChangePassword,
  }
}
