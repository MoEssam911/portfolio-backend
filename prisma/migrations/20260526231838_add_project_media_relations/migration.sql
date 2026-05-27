-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "thumbnailId" TEXT;

-- CreateTable
CREATE TABLE "ProjectGalleryImage" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGalleryImage_projectId_mediaId_key" ON "ProjectGalleryImage"("projectId", "mediaId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGalleryImage" ADD CONSTRAINT "ProjectGalleryImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGalleryImage" ADD CONSTRAINT "ProjectGalleryImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
