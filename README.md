# Steam Auction

A multi-platform application for comparing Steam libraries with friends and picking random co-op games from shared auction pools.

## 🏗️ Architecture

This repository is a **monorepo** containing:

| Package / App | Description |
|---|---|
| `apps/api` | Fastify backend – all business logic, JWT auth, Steam OpenID, database access |
| `apps/web` | Next.js frontend – pure UI layer, consumes `apps/api` via HTTP |
| `apps/desktop` | Tauri configuration for packaging the web frontend as a native desktop app |
| `packages/db` | Prisma ORM client and migrations (used by `apps/api` only) |
| `packages/shared` | Types, Zod validation schemas, and utilities shared across all packages |
| `packages/api-client` | Type-safe HTTP client used by `apps/web` and future mobile clients |

## 🎮 Features

### Authentication & Security
- **Steam OpenID Login** – Secure authentication via Steam's OpenID 2.0
- **JWT Auth** – Access tokens (15 min) + rotating refresh tokens (30 days)
- **httpOnly Cookies** – Refresh token protected from JavaScript; access token verified server-side
- **Auth Guards** – Fastify `preHandler` on every protected route
- **Input Validation** – Zod schemas on all API endpoints (shared between backend and client)

### User Features
- **Dashboard** – Load Steam library, pick shared games with friends, spin the wheel
- **Friends Management** – Load and store Steam friends list
- **Library** – View owned Steam games with playtime
- **Pool Management** – Create and manage auction pools per friend
- **Random Game Picker** – Weighted random selection with avoid-recent-picks mode
- **Profile** – Account details and logout
- **Leaderboard & Recommendations** – Community picks overview

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| API server | Fastify 5 + TypeScript |
| Frontend | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS 4 |
| Database | Prisma + SQLite |
| Auth | Steam OpenID + JWT (`@fastify/jwt`) |
| Validation | Zod (shared) |
| Testing | Vitest |
| Desktop | Tauri 2 |

## 📋 Prerequisites

- Node.js 18+
- npm 9+ (workspaces support required)
- A Steam Web API Key ([Get one here](https://steamcommunity.com/dev/apikey))

## 🚀 Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd steam_auction
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `JWT_SECRET` | Random secret, at least 32 characters |
| `STEAM_API_KEY` | Your Steam Web API key |
| `STEAM_REALM` | Public base URL of the API (e.g. `http://localhost:3001`) |
| `FRONTEND_URL` | URL of the Next.js app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Same as `STEAM_REALM` — accessible from the browser |

### 3. Database Setup

```bash
# Generate the Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Run in Development

```bash
# Start all apps in parallel (API on :3001, web on :3000)
npm run dev
```

Or start them individually:

```bash
# API only
npm run dev --workspace=apps/api

# Web only
npm run dev --workspace=apps/web
```

### 5. Build for Production

```bash
npm run build
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run shared package tests only
npm test --workspace=packages/shared

# Run API tests only
npm test --workspace=apps/api
```

## 📱 Desktop App (Tauri)

The `apps/desktop` directory contains the Tauri configuration for packaging the Next.js frontend as a native desktop application.

```bash
# Prerequisites: install Rust + Tauri CLI
cargo install tauri-cli

# Development
npm run dev --workspace=apps/desktop

# Build desktop app
npm run build --workspace=apps/desktop
```

## 🔌 API Endpoints

All endpoints are served by the Fastify backend (`apps/api`) on port `3001`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | – | Health check |
| `GET` | `/auth/steam` | – | Redirect to Steam OpenID login |
| `GET` | `/auth/steam/callback` | – | Steam callback, issues JWT |
| `POST` | `/auth/refresh` | Cookie | Rotate refresh token, return new access token |
| `POST` | `/auth/logout` | Cookie | Revoke session |
| `GET` | `/me` | JWT | Get current user |
| `GET` | `/friends` | JWT | List saved friends |
| `POST` | `/friends` | JWT | Add a friend by Steam ID |
| `POST` | `/friends/bulk` | JWT | Bulk import friends |
| `DELETE` | `/friends` | JWT | Remove a friend |
| `GET` | `/pools` | JWT | List auction pools |
| `POST` | `/pools` | JWT | Create a pool |
| `POST` | `/pools/:id/games` | JWT | Add a game to a pool |
| `POST` | `/pools/:id/pick` | JWT | Pick a random game |
| `GET` | `/pools/:id/recent-picks` | JWT | Get recently picked app IDs |
| `GET` | `/steam/owned-games` | JWT | Fetch owned games for a Steam ID |
| `GET` | `/steam/friends` | JWT | Fetch Steam friends list |
| `GET` | `/steam/app-details` | – | Fetch store app details |
| `GET` | `/leaderboard` | – | Community pick leaderboard |
| `GET` | `/recommendations` | – | Recommendations |

## 🗂️ Repository Structure

```
steam_auction/
├── apps/
│   ├── api/                  # Fastify backend
│   │   └── src/
│   │       ├── config.ts     # Env var validation
│   │       ├── server.ts     # App factory
│   │       ├── index.ts      # Entry point
│   │       ├── lib/          # session, steam, steam-api helpers
│   │       ├── plugins/      # Fastify auth plugin
│   │       └── routes/       # auth, me, friends, pools, steam, …
│   ├── web/                  # Next.js frontend (pure UI)
│   │   └── src/
│   │       ├── app/          # Next.js App Router pages
│   │       ├── components/   # UI components
│   │       └── lib/          # ApiProvider (React context + hooks)
│   └── desktop/              # Tauri desktop wrapper
│       └── src-tauri/
├── packages/
│   ├── db/                   # Prisma client + migrations
│   ├── shared/               # Types, validation schemas, utilities
│   └── api-client/           # HTTP client (web + future mobile)
├── turbo.json                # Turborepo build pipeline
├── tsconfig.base.json        # Shared TypeScript base config
└── .env.example              # Environment variable template
```


## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- A Steam Web API Key ([Get one here](https://steamcommunity.com/dev/apikey))

## 🚀 Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd steam_auction
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# Steam API - Get from https://steamcommunity.com/dev/apikey
STEAM_API_KEY="YOUR_STEAM_WEB_API_KEY"

# Steam OpenID - Use http://localhost:3000 for local dev
STEAM_REALM="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database
npx prisma migrate deploy

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests include:
- Session authentication and refresh token rotation
- Steam API helpers
- Pick utilities (weighted random selection)
- Component rendering
- Input validation

## 📁 Project Structure

```
steam_auction/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── pools/         # Pool management
│   │   │   └── steam/         # Steam API proxies
│   │   ├── dashboard/         # Dashboard page
│   │   ├── friends/           # Friends page
│   │   ├── library/           # Owned games page
│   │   ├── pools/             # Pool management pages
│   │   └── profile/           # User profile page
│   ├── components/            # React components
│   ├── lib/                   # Utilities and helpers
│   │   ├── prisma.ts         # Prisma client
│   │   ├── session.ts        # Session management
│   │   ├── steam.ts          # Steam OpenID
│   │   ├── steam-api.ts      # Steam Web API
│   │   ├── pickUtils.ts      # Random pick logic
│   │   └── validation.ts     # Zod schemas
│   ├── config/               # Configuration files
│   └── tests/                # Test files
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## 🔑 Key API Routes

### Authentication
- `GET /api/auth/steam` - Initiate Steam login
- `GET /api/auth/steam/callback` - OpenID verification callback
- `GET /api/logout` - Logout and clear session
- `GET /api/me` - Get current user info

### Steam Data
- `GET /api/steam/owned-games?steamId=X` - Fetch owned games (requires auth)
- `GET /api/steam/friends?steamId=X` - Fetch friends list (requires auth)
- `GET /api/steam/app-details?appIds=X,Y,Z` - Get game details

### Pool Management
- `GET /api/pools` - List user's pools (requires auth)
- `POST /api/pools` - Create new pool (requires auth)
- `POST /api/pools/:poolId/games` - Add game to pool (requires ownership)
- `POST /api/pools/:poolId/pick` - Pick random game (requires ownership)
- `GET /api/pools/:poolId/recent-picks` - View recent picks (requires ownership)

### Friends
- `GET /api/friends` - List saved friends
- `POST /api/friends` - Save friend
- `DELETE /api/friends` - Remove friend

## 🔒 Security Features

### Authentication & Authorization
- ✅ All sensitive endpoints require authentication
- ✅ Pool operations verify ownership
- ✅ 401 for unauthenticated, 404 for unauthorized (prevents info leakage)
- ✅ Session cookies are HTTPOnly, SameSite=lax, Secure in production

### Input Validation
- ✅ All user inputs validated with Zod schemas
- ✅ Steam IDs, App IDs, Pool data validated
- ✅ Clear error messages without exposing internals
- ✅ Protection against injection attacks

### Session Management
- ✅ Short-lived session ID (1 hour)
- ✅ Long-lived refresh token (30 days)
- ✅ Automatic token rotation
- ✅ Session revocation on logout

## 🐛 Troubleshooting

### Steam Login Issues

**Problem**: "Steam verification failed" after login

**Solutions**:
- Verify `STEAM_REALM` in `.env` matches your actual URL
- For local dev, use `http://localhost:3000` (not `127.0.0.1`)
- Check that your Steam API key is valid
- Ensure your Steam profile is public

### No Games/Friends Showing

**Problem**: Can't see owned games or friends list

**Solutions**:
- Check that your Steam profile is **public** (not friends-only or private)
- Go to Steam → Profile → Edit Profile → Privacy Settings
- Set "Game details" to Public
- Set "Friends List" to Public
- Some games may not appear if they're hidden or removed from Steam

### Database Issues

**Problem**: Prisma errors or "Database not found"

**Solutions**:
```bash
# Reset and recreate database
rm prisma/dev.db
npx prisma migrate deploy
npx prisma generate
```

### Build Issues

**Problem**: Build fails with font loading errors

**Solution**: This is a known issue in restricted network environments. The app will work in development mode. For production, ensure network access to Google Fonts or use local fonts.

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite database file path |
| `STEAM_API_KEY` | Yes | - | Your Steam Web API key |
| `STEAM_REALM` | Yes | `http://localhost:3000` | Your app's base URL |
| `NODE_ENV` | No | `development` | Environment mode |

## 🚢 Deployment

For production deployment:

1. Update `.env`:
   ```env
   STEAM_REALM="https://yourdomain.com"
   NODE_ENV="production"
   ```

2. Use a production database (PostgreSQL recommended):
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   ```

3. Update `prisma/schema.prisma` provider to `postgresql`

4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. Build and start:
   ```bash
   npm run build
   npm start
   ```

## 🤝 Contributing

This is an MVP project. Key areas for enhancement:
- Add E2E tests with Playwright
- Implement rate limiting
- Add pool sharing/multiplayer features
- Enhanced game filtering and tagging
- User preferences and settings

## 📄 License

MIT License - feel free to use for your own projects!

## 🎯 Credits

Built with Next.js, Prisma, and the Steam Web API.
