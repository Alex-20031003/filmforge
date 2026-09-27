import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify, errors } from 'jose'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'

const OPAQUE_TOKEN_BYTES = 32
const ACCESS_TOKEN_TTL = '15m'
const encodedJWTAccessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const ACCESS_TOKEN_ALGORITHM = 'HS256'

export const generateOpaqueToken = () => {
  const bytes = randomBytes(OPAQUE_TOKEN_BYTES)

  return bytes.toString('base64url')
}

export const hashOpaqueToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex')
}

export const signAccessToken = async (userId: string, sessionId: string) => {
  const accessToken = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM, typ: 'JWT' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(encodedJWTAccessSecret)

  return accessToken
}

export const verifyAccessToken = async (token: string) => {
  try {
    const verifiedAccessToken = await jwtVerify(token, encodedJWTAccessSecret, {
      algorithms: [ACCESS_TOKEN_ALGORITHM],
      requiredClaims: ['exp'],
    })

    const payload = verifiedAccessToken.payload

    if (typeof payload.sub !== 'string' || payload.sub.trim() === '') {
      throw new AppError(
        401,
        'UNAUTHENTICATED',
        'Invalid or expired access token',
      )
    }

    if (
      typeof payload.sessionId !== 'string' ||
      payload.sessionId.trim() === ''
    ) {
      throw new AppError(
        401,
        'UNAUTHENTICATED',
        'Invalid or expired access token',
      )
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
    }
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new AppError(
        401,
        'UNAUTHENTICATED',
        'Invalid or expired access token',
      )
    }

    throw error
  }
}
