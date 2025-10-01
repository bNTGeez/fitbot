-- Add indexes for faster delete operations
CREATE INDEX "Message_chatId_delete_idx" ON "public"."Message"("chatId") WHERE "chatId" IS NOT NULL;
CREATE INDEX "Chat_userId_delete_idx" ON "public"."Chat"("userId") WHERE "userId" IS NOT NULL;