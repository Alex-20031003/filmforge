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

export type LoginBody = z.infer<typeof loginBodySchema>

export const sendRecoveryEmailCodeBodySchema = z.strictObject({}).default({})

const onlyDigits = /^\d+$/

export const verifyCodeCheckSchema = z.strictObject({
  code: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Code is required'
          : 'Code must be a string',
    })
    .length(6, { error: 'The code must be 6 characters long' })
    .regex(onlyDigits, { error: 'Code must contain only digits' }),
})

export const newPasswordSchema = z.strictObject({
  newPassword: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'New password is required'
          : 'New password must be a string',
    })
    .min(10, { error: 'New password must be at least 10 characters' })
    .max(128, { error: 'New password must be at most 128 characters' }),
})

export const forgotPasswordBody = z.strictObject({
  username: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Username is required'
          : 'Username must be a string',
    })
    .trim()
    .min(1, { error: 'Username is required' }),
})

export const resetPasswordBody = z.strictObject({
  token: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Token is required'
          : 'Token must be a string',
    })
    .min(1, { error: 'Token is required' }),

  newPassword: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'New password is required'
          : 'New password must be a string',
    })
    .min(10, { error: 'New password must be at least 10 characters' })
    .max(128, { error: 'New password must be at most 128 characters' }),
})

export const changePasswordBody = z.strictObject({
  currentPassword: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Current password is required'
          : 'Current password must be a string',
    })
    .min(1, { error: 'Current password is required' })
    .max(128, { error: 'Current password must be at most 128 characters' }),

  newPassword: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'New password is required'
          : 'New password must be a string',
    })
    .min(10, { error: 'New password must be at least 10 characters' })
    .max(128, { error: 'New password must be at most 128 characters' }),
})
