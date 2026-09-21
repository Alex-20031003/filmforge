-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('MANAGEMENT', 'PRODUCTION', 'DIRECTING', 'WRITING', 'CASTING', 'LOCATIONS', 'CAMERA', 'LIGHTING', 'SOUND', 'ART', 'COSTUME', 'MAKEUP', 'POST_PRODUCTION', 'ACTING', 'OTHER');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "recoveryEmail" TEXT,
    "recoveryEmailVerifiedAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "systemRole" "SystemRole" NOT NULL DEFAULT 'MEMBER',
    "companyId" UUID NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT NOT NULL,
    "bio" TEXT,
    "department" "Department" NOT NULL,
    "employmentStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_recoveryEmail_key" ON "UserAccount"("recoveryEmail");

-- CreateIndex
CREATE INDEX "UserAccount_companyId_systemRole_idx" ON "UserAccount"("companyId", "systemRole");

-- CreateIndex
CREATE INDEX "EmployeeProfile_department_employmentStatus_idx" ON "EmployeeProfile"("department", "employmentStatus");

-- CreateIndex
CREATE INDEX "EmployeeProfile_lastName_firstName_idx" ON "EmployeeProfile"("lastName", "firstName");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
