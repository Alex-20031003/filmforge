import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import argon2 from 'argon2'

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

  const owner = await prisma.userAccount.upsert({
    where: { username: OWNER_USERNAME },
    update: {},
    create: {
      username: OWNER_USERNAME,
      passwordHash,
      recoveryEmail: null,
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
}

try {
  await main()
} catch (error) {
  console.error(error, 'Company seed failed')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
