// Simple in-memory cache for chat history
const chatCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export function getCachedChatHistory(userId: string) {
  const key = `chat-history-${userId}`;
  const cached = chatCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  return null;
}

export function setCachedChatHistory(userId: string, data: any) {
  const key = `chat-history-${userId}`;
  chatCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateChatCache(userId: string) {
  const key = `chat-history-${userId}`;
  chatCache.delete(key);
}
