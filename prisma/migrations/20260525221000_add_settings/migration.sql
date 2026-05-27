-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "siteTitle" TEXT NOT NULL,
    "siteDescription" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "resumeFileUrl" TEXT,
    "availableForWork" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
