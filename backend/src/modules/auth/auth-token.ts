import { createHash, randomBytes } from 'node:crypto'

const OPAQUE_TOKEN_BYTES = 32

export const generateOpaqueToken = () => {
  const bytes = randomBytes(OPAQUE_TOKEN_BYTES)

  return bytes.toString('base64url')
}

export const hashOpaqueToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex')
}
