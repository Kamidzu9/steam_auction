# Steam Auction

Compare Steam libraries with friends and pick random co-op games from shared pools.

## Architecture

**Monorepo** managed with npm workspaces + Turborepo.

| Workspace             | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `apps/api`            | Fastify backend — auth, business logic, Steam proxy, DB      |
| `apps/web`            | Next.js frontend — static SPA, consumes API via HTTP         |
| `apps/desktop`        | Tauri wrapper — packages the web app as a native desktop app |
| `packages/db`         | Prisma ORM client and migrations                             |
| `packages/shared`     | Shared types, Zod schemas, and utility functions             |
| `packages/api-client` | Type-safe HTTP client for the API                            |

## Features

- **Steam OpenID login** — secure server-side authentication
- **JWT auth** — short-lived access tokens (15 min) + rotating refresh tokens (30 days, httpOnly cookies)
- **Friends management** — import from Steam or add manually
- **Library comparison** — find games you and your friends share
- **Auction pools** — create pools of shared games
- **Random game picker** — weighted selection with avoid-recent-picks mode and animated spinning wheel
- **Rate limiting** — API requests are rate-limited (100 req/min)
- **Steam API caching** — server-side 5-minute cache for Steam responses

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| API        | Fastify 5, TypeScript               |
| Frontend   | Next.js 16 (App Router), React 19   |
| Styling    | Tailwind CSS 4                      |
| Database   | Prisma + SQLite                     |
| Auth       | Steam OpenID + JWT (`@fastify/jwt`) |
| Validation | Zod (shared between API and client) |
| Testing    | Vitest                              |
| Desktop    | Tauri 2                             |
| CI         | GitHub Actions                      |

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 11+
- A [Steam Web API Key](https://steamcommunity.com/dev/apikey)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, STEAM_API_KEY

# 3. Set up the database
npm run db:generate
npm run db:migrate

# 4. Start development (API on :3010, web on :3000)
npm run dev
```

## Server configuration

Copy `.env.example` to `.env` and edit the following values before running the app:

- `STEAM_API_KEY`: your Steam Web API key from https://steamcommunity.com/dev/apikey (required for Steam login, friends, owned-games).
- `STEAM_REALM`: public base URL of your API (e.g. `http://localhost:3010` for local dev).
- `PORT`: port the API will bind to (default `3010`).

Make sure `NEXT_PUBLIC_API_URL` in `.env` matches the API base URL so the frontend can reach the backend.

If you don't set `STEAM_API_KEY` you will see a warning in development; in production the API will refuse to start until the key is provided.

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable              | Required | Description                                            |
| --------------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`        | Yes      | SQLite path, e.g. `file:./dev.db`                      |
| `JWT_SECRET`          | Yes      | Random secret, at least 32 characters                  |
| `STEAM_API_KEY`       | Yes      | Steam Web API key (server-side only)                   |
| `STEAM_REALM`         | No       | Public API URL (default: `http://localhost:3010`)      |
| `FRONTEND_URL`        | No       | Frontend URL (default: `http://localhost:3000`)        |
| `NEXT_PUBLIC_API_URL` | No       | API URL for browser (default: `http://localhost:3010`) |

## Testing

```bash
# Run all tests (106 tests across 4 workspaces)
npm run test:unit

# Run tests for a specific workspace
npm test --workspace=packages/shared     # 22 tests
npm test --workspace=packages/api-client # 20 tests
npm test --workspace=apps/api            # 58 tests
npm test --workspace=apps/web            # 6 tests
```

## API Endpoints

All endpoints served by the Fastify backend on port `3010`.

| Method   | Path                      | Auth   | Description                      |
| -------- | ------------------------- | ------ | -------------------------------- |
| `GET`    | `/health`                 | —      | Health check                     |
| `GET`    | `/auth/steam`             | —      | Redirect to Steam OpenID login   |
| `GET`    | `/auth/steam/callback`    | —      | Steam callback, issues JWT       |
| `POST`   | `/auth/refresh`           | Cookie | Rotate refresh token             |
| `POST`   | `/auth/logout`            | Cookie | Revoke session                   |
| `GET`    | `/me`                     | JWT    | Get current user                 |
| `GET`    | `/friends`                | JWT    | List saved friends               |
| `POST`   | `/friends`                | JWT    | Add a friend                     |
| `POST`   | `/friends/bulk`           | JWT    | Bulk import friends              |
| `DELETE` | `/friends`                | JWT    | Remove a friend                  |
| `GET`    | `/pools`                  | JWT    | List auction pools               |
| `POST`   | `/pools`                  | JWT    | Create a pool                    |
| `POST`   | `/pools/:id/games`        | JWT    | Add a game to a pool             |
| `POST`   | `/pools/:id/pick`         | JWT    | Pick a random game               |
| `GET`    | `/pools/:id/recent-picks` | JWT    | Get recently picked app IDs      |
| `GET`    | `/steam/owned-games`      | JWT    | Fetch owned games for a Steam ID |
| `GET`    | `/steam/friends`          | JWT    | Fetch Steam friends list         |
| `GET`    | `/steam/app-details`      | —      | Fetch store app details          |

## Repository Structure

```
steam_auction/
├── apps/
│   ├── api/                  # Fastify backend
│   │   └── src/
│   │       ├── config.ts     # Env validation (Zod)
│   │       ├── server.ts     # App factory
│   │       ├── index.ts      # Entry point
│   │       ├── lib/          # session, steam, steam-api (with caching)
│   │       ├── plugins/      # Fastify auth plugin
│   │       └── routes/       # auth, me, friends, pools, steam
│   ├── web/                  # Next.js frontend
│   │   └── src/
│   │       ├── app/          # App Router pages
│   │       │   └── dashboard/  # Dashboard + section components
│   │       ├── components/   # Shared UI (Icons, AuctionWheel, etc.)
│   │       └── lib/          # ApiProvider context
│   └── desktop/              # Tauri desktop wrapper
├── packages/
│   ├── db/                   # Prisma schema + migrations
│   ├── shared/               # Types, Zod schemas, utilities
│   └── api-client/           # Type-safe HTTP client
├── .github/workflows/        # CI/CD (ci.yml, release.yml)
├── turbo.json                # Turborepo pipeline
├── tsconfig.base.json        # Shared TS config
└── .env.example              # Environment template
```

## Security

- **Steam API key** — stored server-side only, never exposed to clients
- **JWT** — access tokens in httpOnly cookies, refresh tokens with SHA-256 hashing and rotation
- **Rate limiting** — 100 requests per minute per IP
- **Input validation** — Zod schemas on all API endpoints
- **CORS** — restricted to configured frontend origin
- **Ownership checks** — pool operations verify the requesting user owns the resource

## Desktop App (Tauri)

```bash
# Prerequisites: Rust toolchain
cargo install tauri-cli

# Development
npm run dev --workspace=apps/desktop

# Build
npm run build --workspace=apps/desktop
```

## License

MIT
