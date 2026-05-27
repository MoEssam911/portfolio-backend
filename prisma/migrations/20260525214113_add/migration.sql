/*
  Warnings:

  - Changed the type of `type` on the `ResumeSection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResumeSectionType" AS ENUM ('experience', 'education', 'skills', 'projects', 'custom');

-- AlterTable
ALTER TABLE "ResumeSection" DROP COLUMN "type",
ADD COLUMN     "type" "ResumeSectionType" NOT NULL;
