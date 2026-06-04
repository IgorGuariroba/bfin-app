-- AlterTable
ALTER TABLE "PluggyItem" ADD COLUMN     "connectedByUserId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PluggyItem_connectedByUserId_idx" ON "PluggyItem"("connectedByUserId");

-- AddForeignKey
ALTER TABLE "PluggyItem" ADD CONSTRAINT "PluggyItem_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

