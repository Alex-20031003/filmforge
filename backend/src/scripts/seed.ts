import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import argon2 from 'argon2'
import { seedEmployees } from './seed-employees.data.js'

const COMPANY_ID = 'a8e63f7d-1e2b-4c9a-8d5f-7b6c3e2f1a90'
const COMPANY_NAME = 'Northlight Pictures'
const OWNER_USERNAME = 'alex.morgan'

const seedEnvSchema = z.object({
  SEED_TEMP_PASSWORD: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'SEED_TEMP_PASSWORD is required'
          : 'SEED_TEMP_PASSWORD must be a string',
    })
    .min(10, { error: 'SEED_TEMP_PASSWORD must be at least 10 characters' })
    .max(128, { error: 'SEED_TEMP_PASSWORD must be at most 128 characters' }),

  OWNER_RECOVERY_EMAIL: z
    .email({
      error: (issue) =>
        issue.input === undefined
          ? 'OWNER_RECOVERY_EMAIL is required'
          : 'OWNER_RECOVERY_EMAIL must be an email',
    })
    .trim()
    .max(255, { error: 'OWNER_RECOVERY_EMAIL must be at most 255 characters' }),

  SEED_EMPLOYEE_EMAIL_DOMAIN: z
    .string()
    .trim()
    .toLowerCase()
    .max(180)
    .default('northlight.example.test')
    .refine((domain) => z.email().safeParse(`employee@${domain}`).success, {
      error: 'SEED_EMPLOYEE_EMAIL_DOMAIN must be a valid email domain',
    }),
})

async function main() {
  const seedEnv = seedEnvSchema.safeParse(process.env)

  if (!seedEnv.success) {
    console.error('Invalid seed environment')
    console.error(z.prettifyError(seedEnv.error))
    process.exitCode = 1
    return
  }

  // Ensure the initial Company exists
  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      name: COMPANY_NAME,
      description: null,
      logoUrl: null,
    },
  })

  const companyCount = await prisma.company.count()

  if (companyCount !== 1) {
    throw new Error(`Expected exactly one Company, found ${companyCount}`)
  }

  const tempPassword = seedEnv.data.SEED_TEMP_PASSWORD
  const passwordHash = await argon2.hash(tempPassword)

  const ownerRecoveryEmail = seedEnv.data.OWNER_RECOVERY_EMAIL

  const owner = await prisma.userAccount.upsert({
    where: { username: OWNER_USERNAME },
    update: {},
    create: {
      username: OWNER_USERNAME,
      passwordHash,
      recoveryEmail: ownerRecoveryEmail,
      recoveryEmailVerifiedAt: null,
      mustChangePassword: true,
      accountStatus: 'PENDING_ACTIVATION',
      systemRole: 'OWNER',

      company: {
        connect: { id: company.id },
      },

      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Morgan',
          department: 'MANAGEMENT',
          jobTitle: 'Studio Owner',
          employmentStatus: 'ACTIVE',
        },
      },
    },
    include: { profile: true },
  })

  if (owner.companyId !== company.id || !owner.profile) {
    console.error('Seed account must belong to the Company and have a profile')
    process.exitCode = 1
    return
  }

  console.log(`Company ready: ${company.name} (${company.id})`)
  console.log(`Initial account ready: ${owner.username} (${owner.id})`)

  for (const employee of seedEmployees) {
    const employmentStatus = employee.employmentStatus ?? 'ACTIVE'

    const account = await prisma.userAccount.upsert({
      where: { username: employee.username },
      // Preserve activation, profile edits, credentials and sessions on reruns.
      update: {},
      create: {
        username: employee.username,
        // Each account receives its own Argon2 salt.
        passwordHash: await argon2.hash(tempPassword),
        recoveryEmail: `${employee.username}@${seedEnv.data.SEED_EMPLOYEE_EMAIL_DOMAIN}`,
        // Demo sign-in does not imply that the fictional mailbox is verified.
        recoveryEmailVerifiedAt: null,
        mustChangePassword: false,
        accountStatus: employmentStatus === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        systemRole: employee.systemRole ?? 'MEMBER',
        company: {
          connect: { id: company.id },
        },
        profile: {
          create: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department,
            jobTitle: employee.jobTitle,
            employmentStatus,
          },
        },
      },
      select: {
        companyId: true,
        profile: { select: { userId: true } },
      },
    })

    if (account.companyId !== company.id || !account.profile) {
      throw new Error(
        `Seed account ${employee.username} must belong to the Company and have a profile`,
      )
    }
  }

  console.log(`Demo employee records ready: ${seedEmployees.length}`)
  console.log(
    'Existing accounts were preserved. New ACTIVE demo employees can sign in without activation.',
  )
}

try {
  await main()
} catch (error) {
  console.error(error, 'Company seed failed')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
