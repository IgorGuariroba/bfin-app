-- DropIndex
DROP INDEX "WhatsappConversation_contactId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_contactId_key" ON "WhatsappConversation"("contactId");
