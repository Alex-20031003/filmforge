import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(4200),

  DATABASE_URL: z
    .url()
    .min(1, { error: 'DATABASE_URL cannot be empty' })
    .refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      "DATABASE_URL must start with 'postgres://' or 'postgresql://'",
    ),

  JWT_ACCESS_SECRET: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'JWT_ACCESS_SECRET is required'
          : 'JWT_ACCESS_SECRET must be a string',
    })
    .min(32, { error: 'JWT_ACCESS_SECRET must be at least 32 characters' }),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment configuration')
  console.error(z.prettifyError(result.error))
  process.exit(1)
}

export const env = result.data
