# Setup Guide

This guide walks you through setting up the Furma Core Template.

## Prerequisites

- Bun 1.0+
- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- Git

## Step 1: Clone the Template

```bash
git clone git@github.com:Fuuurma/furma-core-template.git my-product
cd my-product
rm -rf .git
git init
```

## Step 2: Install Dependencies

```bash
bun install
```

## Step 3: Configure Environment

```bash
cp .env.example .env.local
bun run setup
```

The setup script will:
- Create `.env.local` from `.env.example`
- Generate a BYOK encryption key
- Generate a NextAuth secret

## Step 4: Configure Environment Variables

Edit `.env.local` with your values:

```env
# Database (required)
DATABASE_URL="postgresql://..."

# OAuth (at least one required)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Upstash Redis (optional, for rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_CREDITS=""
```

## Step 5: Set Up Database

```bash
bun run db:generate
bun run db:migrate
```

## Step 6: Start Development Server

```bash
bun run dev
```

Visit http://localhost:3000 to see your application.

## Next Steps

- Read the [Development Guide](../developer-guide/development.md)
- Learn about [API Routes](../developer-guide/api-routes.md)
- Review [Security Practices](../architecture/security.md)

## Troubleshooting

### Database Connection Issues

Make sure your `DATABASE_URL` is correct and the database is accessible.

### OAuth Not Working

Verify your OAuth credentials are correct:
- Google: Get credentials from Google Cloud Console
- GitHub: Get credentials from GitHub Developer Settings

### Missing Dependencies

Run `bun install` to ensure all dependencies are installed.
