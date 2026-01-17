# Steam Auction MVP

Compare Steam libraries with friends and pick a random co-op game from a shared auction pool.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (local MVP)

## Environment

Create a `.env` file:

```
DATABASE_URL="file:./dev.db"
STEAM_API_KEY="YOUR_STEAM_WEB_API_KEY"
STEAM_REALM="http://localhost:3000"
```

## Setup

```
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Run

```
npm run dev
```

## Key Routes

- /api/auth/steam → Steam OpenID login
- /api/auth/steam/callback → OpenID verification + session cookie
- /api/steam/owned-games?steamId=...
- /api/steam/friends?steamId=...
- /api/pools (POST)
- /api/pools/:poolId/games (POST)
- /api/pools/:poolId/pick (POST)

## Notes

- Steam-owned games and friends require public profiles or explicit consent.
- The MVP uses a simple cookie session; secure session storage should be added for production.
