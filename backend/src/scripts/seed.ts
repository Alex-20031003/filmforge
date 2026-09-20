import { prisma } from '../lib/prisma.js'

const COMPANY_ID = 'a8e63f7d-1e2b-4c9a-8d5f-7b6c3e2f1a90'
const COMPANY_NAME = 'Northlight Pictures'

async function main() {
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

  console.log(
    `Company ready: ${company.name} (ID: ${company.id}). Total companies: ${companyCount}`,
  )
}

try {
  await main()
} catch (error) {
  console.error('Company seed failed')
  console.error(error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
