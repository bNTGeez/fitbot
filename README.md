# FitBot 💪

An AI agent-powered fitness companion that provides personalized workout plans, nutrition advice, and health insights. Built with Next.js, OpenAI, and on-demand web research capabilities.

## Features

- 🤖 **AI-Agent Chat**: Get instant, personalized fitness and nutrition advice from an AI coach
- 🔍 **On-Demand Web Research**: Automatically searches the web for fitness information with intelligent source caching
- 💬 **Chat History**: Persistent chat history with the ability to continue previous conversations
- 🎯 **Scope-Focused**: Specialized in fitness, gym, nutrition, and health topics only
- ⚡ **Smart Caching**: Response caching system for faster answers to common questions
- 🔐 **Secure Authentication**: Auth0 integration for secure user management
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices

Unlike generic AI chatbots, FitBot enforces domain scope, caching, and tool-based research to produce consistent, cost-efficient fitness guidance.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4 class model via Vercel AI SDK (cost-optimized)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **Web Search**: SerpAPI
- **Web Scraping**: Playwright
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Project Structure

```
fitbot/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── agent/         # AI agent endpoint
│   │   ├── auth/          # Auth0 authentication routes
│   │   ├── chat/          # Chat management endpoints
│   │   └── cache/         # Cache management
│   ├── chat/              # Chat UI pages
│   ├── home/              # Home page
│   ├── profile/           # User profile page
│   └── components/        # React components
├── lib/                   # Utility libraries
│   ├── tools/             # AI agent tools (search, fetch-page, save-notes)
│   ├── checks/            # Scope checking for fitness topics
│   ├── auth0.ts           # Auth0 client configuration
│   ├── prisma.ts          # Prisma client
│   ├── db.ts              # Database utilities
│   └── cache-utils.ts     # Caching utilities
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## Key Features Explained

### AI Agent with Tools

The AI agent has access to three main tools:

1. **Search Tool**: Searches the web for fitness-related information using SerpAPI
2. **Fetch Page Tool**: Extracts content from web pages using Playwright
3. **Save Notes Tool**: Designed for future persistence of research insights (extensible agent capability)

### Scope Checking

FitBot is designed to only answer questions about:

- Workouts and exercises
- Nutrition and diet
- Fitness equipment
- Training programs
- Health and wellness (fitness-related)

Questions outside this scope receive a polite redirect message.

### Caching System

- **Answer Caching**: Responses are cached for 7 days to reduce API costs
- **Source Caching**: Scraped web pages are cached for 3 days
- **Chat History Caching**: Recent chat lists are cached for performance

## API Routes

- `POST /api/agent` - Main AI agent endpoint for chat
- `GET /api/chat` - Get chat history
- `POST /api/chat` - Save a message to a chat
- `DELETE /api/chat` - Delete a chat
- `POST /api/chat/new` - Create a new chat
- `GET /api/auth/login` - Auth0 login
- `GET /api/auth/logout` - Auth0 logout
- `GET /api/auth/callback` - Auth0 callback

## Database Schema

- **User**: Stores user information from Auth0
- **Chat**: Chat sessions for each user
- **Message**: Individual messages within chats
- **CachedAnswer**: Cached AI responses for common questions
- **ScrapedSource**: Cached web page content

## Deployment

- Frontend & API deployed on Vercel (Next.js App Router)
- PostgreSQL hosted on managed cloud database
- Auth handled via Auth0 (OAuth + JWT)
- Environment-based configuration for dev / prod parity

Check it out:

https://fitbot-e5sm-752e12k9h-benjamin-tangs-projects.vercel.app/
