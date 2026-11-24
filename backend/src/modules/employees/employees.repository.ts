import { Prisma, type AccountStatus } from '../../generated/prisma/client.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'
import { prisma } from '../../lib/prisma.js'
import type {
  EmployeeQueryParams,
  UpdateEmployeeBody,
} from './employees.schemas.js'

const employeeProfileSelect = {
  userId: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  phone: true,
  department: true,
  jobTitle: true,
  bio: true,
  employmentStatus: true,
} satisfies Prisma.EmployeeProfileSelect

export const findUserAccountById = async (userId: string) => {
  return prisma.userAccount.findUnique({
    where: { id: userId },
    select: {
      id: true,
      systemRole: true,
      accountStatus: true,
      mustChangePassword: true,
      profile: {
        select: employeeProfileSelect,
      },
    },
  })
}

export const findEmployees = async (queryParams: EmployeeQueryParams) => {
  const { page, limit, search, department, status } = queryParams

  const profileWhere: Prisma.EmployeeProfileWhereInput = {
    employmentStatus: status ?? {
      in: [EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE],
    },
  }

  if (department !== undefined) {
    profileWhere.department = department
  }

  if (search) {
    profileWhere.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { jobTitle: { contains: search, mode: 'insensitive' } },
    ]
  }

  const accounts = await prisma.userAccount.findMany({
    where: {
      profile: {
        is: profileWhere,
      },
    },
    select: {
      profile: {
        select: employeeProfileSelect,
      },
    },
    orderBy: [
      { profile: { lastName: 'asc' } },
      { profile: { firstName: 'asc' } },
      { id: 'asc' },
    ],
    skip: (page - 1) * limit,
    take: limit,
  })

  const totalEmployeesCount = await prisma.userAccount.count({
    where: {
      profile: {
        is: profileWhere,
      },
    },
  })

  const employeesProfile = accounts.flatMap(({ profile }) =>
    profile === null ? [] : [profile],
  )

  return {
    employeesProfile,
    totalEmployeesCount,
  }
}

export const findEmployeeById = async (userId: string) => {
  const account = await findUserAccountById(userId)

  return account?.profile ?? null
}

export const updateEmployeeRecord = async (
  userId: string,
  updateData: UpdateEmployeeBody,
  nextAccountStatus?: AccountStatus,
) => {
  const profileData = Object.fromEntries(
    Object.entries(updateData).filter(([, value]) => value !== undefined),
  )

  const data: Prisma.UserAccountUpdateInput = {
    profile: {
      update: profileData,
    },
  }

  if (nextAccountStatus !== undefined) {
    data.accountStatus = nextAccountStatus
  }

  if (nextAccountStatus === 'DISABLED') {
    data.authSessions = {
      updateMany: {
        where: {
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      },
    }
  }

  const account = await prisma.userAccount.update({
    where: { id: userId },
    data,
    select: {
      profile: {
        select: employeeProfileSelect,
      },
    },
  })

  if (account.profile === null) {
    throw new Error('Employee profile is missing after update')
  }

  return account.profile
}

export const countOtherActiveOwners = async (userId: string) => {
  return prisma.userAccount.count({
    where: {
      id: { not: userId },
      systemRole: 'OWNER',
      accountStatus: 'ACTIVE',
      profile: {
        employmentStatus: 'ACTIVE',
      },
    },
  })
}
