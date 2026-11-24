import { z } from 'zod'
import { Department, EmployeeStatus } from '../../generated/prisma/enums.js'

export const employeeQueryParamsSchema = z.strictObject({
  page: z.coerce
    .number({ error: 'Page must be a number' })
    .int({ error: 'Page must be an integer' })
    .positive({ error: 'Page must be greater than 0' })
    .default(1),

  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int({ error: 'Limit must be an integer' })
    .positive({ error: 'Limit must be greater than 0' })
    .default(20),

  search: z.string({ error: 'Search term must be a string' }).trim().optional(),

  department: z.enum(Department, { error: 'Invalid department' }).optional(),

  status: z
    .enum(EmployeeStatus)
    .exclude([EmployeeStatus.INACTIVE], {
      error: 'Status must be ACTIVE or ON_LEAVE',
    })
    .optional(),
})

export type EmployeeQueryParams = z.infer<typeof employeeQueryParamsSchema>

export const employeeIdParamSchema = z.strictObject({
  userId: z.uuid({ error: 'User ID must be a UUID' }).trim(),
})

export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>

export const updateEmployeeBodySchema = z.strictObject({
  photoUrl: z.url({ error: 'Photo URL must be a valid URL' }).trim().optional(),

  phone: z.string({ error: 'Phone number must be a string' }).trim().optional(),

  bio: z.string({ error: 'Bio must be a string' }).trim().optional(),

  department: z.enum(Department, { error: 'Invalid department' }).optional(),

  jobTitle: z
    .string({ error: 'Job title must be a string' })
    .trim()
    .min(1, { error: 'Job title must be at least 1 character long' })
    .optional(),

  employmentStatus: z
    .enum(EmployeeStatus, { error: 'Invalid employment status' })
    .optional(),
})

export type UpdateEmployeeBody = z.infer<typeof updateEmployeeBodySchema>
