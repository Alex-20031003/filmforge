import { z } from 'zod'

export const loginBodySchema = z.strictObject({
  username: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Username is required'
          : 'Username must be a string',
    })
    .trim()
    .min(1, { error: 'Username is required' }),

  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Password is required'
          : 'Password must be a string',
    })
    .min(1, { error: 'Password is required' })
    .max(128, { error: 'Password must be at most 128 characters' }),
})
