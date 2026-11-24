import type { AccountStatus } from '../../generated/prisma/enums.js'
import { AppError } from '../../shared/errors/app-error.js'
import {
  countOtherActiveOwners,
  findEmployeeById,
  findEmployees,
  findUserAccountById,
  updateEmployeeRecord,
} from './employees.repository.js'
import type {
  EmployeeQueryParams,
  UpdateEmployeeBody,
} from './employees.schemas.js'

export const getEmployees = async (queryParams: EmployeeQueryParams) => {
  const employeesResult = await findEmployees(queryParams)

  const { page, limit } = queryParams
  const total = employeesResult.totalEmployeesCount

  return {
    data: employeesResult.employeesProfile,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getEmployee = async (userId: string) => {
  const employeeProfile = await findEmployeeById(userId)

  if (!employeeProfile || employeeProfile.employmentStatus === 'INACTIVE') {
    throw new AppError(404, 'NOT_FOUND', 'Employee not found')
  }

  return employeeProfile
}

export const updateEmployee = async (
  userId: string,
  updateData: UpdateEmployeeBody,
  requesterUserId: string,
) => {
  const requesterAccount = await findUserAccountById(requesterUserId)

  if (!requesterAccount || requesterAccount.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session')
  }

  const targetAccount = await findUserAccountById(userId)

  if (!targetAccount || !targetAccount.profile) {
    throw new AppError(404, 'NOT_FOUND', 'Employee not found')
  }

  const isSelfUpdate = requesterUserId === userId

  const canEditCompanyFields =
    requesterAccount.systemRole === 'ADMIN' ||
    requesterAccount.systemRole === 'OWNER'

  const hasCompanyFieldChanges =
    updateData.department !== undefined ||
    updateData.jobTitle !== undefined ||
    updateData.employmentStatus !== undefined

  const hasPersonalFieldChanges =
    updateData.photoUrl !== undefined ||
    updateData.phone !== undefined ||
    updateData.bio !== undefined

  if (hasCompanyFieldChanges && !canEditCompanyFields) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to update company-related fields',
    )
  }

  if (hasPersonalFieldChanges && !isSelfUpdate) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to update personal fields of other employees',
    )
  }

  const isReturningFromLeave =
    targetAccount.profile.employmentStatus === 'ON_LEAVE' &&
    updateData.employmentStatus === 'ACTIVE' &&
    targetAccount.accountStatus === 'DISABLED'

  let nextAccountStatus: AccountStatus | undefined =
    updateData.employmentStatus === 'ON_LEAVE' ||
    updateData.employmentStatus === 'INACTIVE'
      ? 'DISABLED'
      : undefined

  if (isReturningFromLeave) {
    nextAccountStatus = 'ACTIVE'

    if (targetAccount.mustChangePassword === true) {
      nextAccountStatus = 'PENDING_ACTIVATION'
    }
  }

  if (
    requesterAccount.systemRole === 'ADMIN' &&
    targetAccount.systemRole === 'OWNER' &&
    nextAccountStatus === 'DISABLED'
  ) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to disable the account of an OWNER',
    )
  }

  if (
    targetAccount.systemRole === 'OWNER' &&
    nextAccountStatus === 'DISABLED'
  ) {
    const otherActiveOwnersCount = await countOtherActiveOwners(userId)

    if (otherActiveOwnersCount === 0 && nextAccountStatus === 'DISABLED') {
      throw new AppError(
        409,
        'CONFLICT',
        'Cannot disable the last active OWNER account',
      )
    }
  }

  return await updateEmployeeRecord(userId, updateData, nextAccountStatus)
}
