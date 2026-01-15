import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Get base URL - use VERCEL_URL for preview deployments, fallback to AUTH0_BASE_URL
const getBaseUrl = () => {
  // Vercel automatically sets VERCEL_URL for all deployments (preview and production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to AUTH0_BASE_URL if VERCEL_URL is not available (local dev)
  const baseUrl = process.env.AUTH0_BASE_URL;
  if (!baseUrl) {
    console.error("AUTH0_BASE_URL is not set and VERCEL_URL is not available");
  }
  return baseUrl;
};

// Initialize the Auth0 client with explicit configuration
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", ""),
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: getBaseUrl(),
  secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    backChannelLogout: "/api/auth/backchannel-logout",
  },
});
