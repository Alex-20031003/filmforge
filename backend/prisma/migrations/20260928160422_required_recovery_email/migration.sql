/*
  Warnings:

  - Made the column `recoveryEmail` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserAccount" ALTER COLUMN "recoveryEmail" SET NOT NULL;
