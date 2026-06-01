-- CreateTable
CREATE TABLE "favorite_project" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_project_userId_projectId_key" ON "favorite_project"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "favorite_project" ADD CONSTRAINT "favorite_project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_project" ADD CONSTRAINT "favorite_project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
