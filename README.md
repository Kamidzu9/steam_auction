# Steam Auction MVP

A full-featured web application for comparing Steam libraries with friends and picking random co-op games from shared auction pools.

## 🎮 Features

### Authentication & Security
- **Steam OpenID Login** - Secure authentication via Steam
- **Session Management** - HTTPOnly cookies with refresh tokens (30-day expiry)
- **Authorization Guards** - All protected routes require authentication
- **Input Validation** - Comprehensive Zod validation on all API endpoints
- **Secure by Default** - No data leaks, proper 401/403/404 responses

### User Features
- **Dashboard** - Overview of your pools, friends, and quick actions
- **Friends Management** - Load and display Steam friends
- **Library** - View your owned Steam games with playtime
- **Pool Management** - Create, view, and manage auction pools with friends
- **Random Game Picker** - Weighted random selection with avoid-recent-picks mode
- **Profile** - View account details and logout

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4.0
- **Database**: Prisma + SQLite (for MVP, production-ready schema)
- **Authentication**: Steam OpenID + Session-based auth
- **Validation**: Zod for input validation
- **Testing**: Vitest + Testing Library

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
