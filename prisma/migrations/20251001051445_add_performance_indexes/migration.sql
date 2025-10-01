-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "auth0Id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CachedAnswer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionHash" TEXT NOT NULL,
    "originalQuestion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "retrieverVersion" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" JSONB,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isRefreshing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CachedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScrapedSource" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "rawHtml" TEXT,
    "contentLength" INTEGER,
    "etag" TEXT,
    "lastModified" TIMESTAMP(3),
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isRefreshing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScrapedSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "public"."User"("auth0Id");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "public"."Message"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedAnswer_questionHash_key" ON "public"."CachedAnswer"("questionHash");

-- CreateIndex
CREATE INDEX "CachedAnswer_lastUsed_idx" ON "public"."CachedAnswer"("lastUsed");

-- CreateIndex
CREATE INDEX "CachedAnswer_hitCount_lastUsed_idx" ON "public"."CachedAnswer"("hitCount", "lastUsed");

-- CreateIndex
CREATE INDEX "CachedAnswer_expiresAt_idx" ON "public"."CachedAnswer"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedAnswer_isRefreshing_idx" ON "public"."CachedAnswer"("isRefreshing");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedSource_urlHash_key" ON "public"."ScrapedSource"("urlHash");

-- CreateIndex
CREATE INDEX "ScrapedSource_url_idx" ON "public"."ScrapedSource"("url");

-- CreateIndex
CREATE INDEX "ScrapedSource_urlHash_idx" ON "public"."ScrapedSource"("urlHash");

-- CreateIndex
CREATE INDEX "ScrapedSource_lastUsed_idx" ON "public"."ScrapedSource"("lastUsed");

-- CreateIndex
CREATE INDEX "ScrapedSource_hitCount_lastUsed_idx" ON "public"."ScrapedSource"("hitCount", "lastUsed");

-- CreateIndex
CREATE INDEX "ScrapedSource_expiresAt_idx" ON "public"."ScrapedSource"("expiresAt");

-- CreateIndex
CREATE INDEX "ScrapedSource_isRefreshing_idx" ON "public"."ScrapedSource"("isRefreshing");

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Performance indexes for faster queries
CREATE INDEX "Chat_userId_createdAt_idx" ON "public"."Chat"("userId", "createdAt" DESC);
CREATE INDEX "Message_chatId_createdAt_idx" ON "public"."Message"("chatId", "createdAt" ASC);
CREATE INDEX "Chat_id_userId_idx" ON "public"."Chat"("id", "userId");
