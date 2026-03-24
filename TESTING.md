# Testing & Pre-Release Pipeline

This document explains how the test suite is organised, how to run tests locally, how the CI/CD pipeline works, and how to create a pre-release build.

---

## Table of Contents

1. [Test Strategy](#test-strategy)
2. [Running Tests Locally](#running-tests-locally)
3. [Test Coverage Overview](#test-coverage-overview)
4. [CI Pipeline](#ci-pipeline)
5. [Pre-Release Build Pipeline](#pre-release-build-pipeline)
6. [Creating a Pre-Release](#creating-a-pre-release)
7. [Versioning](#versioning)
8. [Quality Gates](#quality-gates)
9. [Assumptions & Limitations](#assumptions--limitations)

---

## Test Strategy

The project uses a **layered testing approach**:

| Layer           | Scope                                                     | Tool                     |
| --------------- | --------------------------------------------------------- | ------------------------ |
| **Unit**        | Business logic, utilities, validation schemas, API client | Vitest                   |
| **Integration** | Fastify routes, DB interactions (mocked), auth guards     | Vitest + Fastify inject  |
| **Component**   | React component rendering, user interactions              | Vitest + Testing Library |

### Principles

- No untested critical logic (auth, pick algorithm, validation).
- Tests reflect real usage — minimal mocking at higher levels.
- Deterministic and stable: no real network calls or real DB.
- External services (Steam API, DB) are mocked at the boundary.
- Every commit is automatically validated in CI.

---

## Running Tests Locally

### Prerequisites

```bash
# Install all dependencies from the monorepo root
npm install
```

### Run all tests

```bash
# All workspaces (uses Turborepo)
npm test

# Or run each workspace individually (faster, no build dependency):
npm test --workspace=packages/shared
npm test --workspace=packages/api-client
npm test --workspace=apps/api
npm test --workspace=apps/web
```

### Run a specific test file

```bash
# From the workspace root
cd apps/api
npx vitest run src/__tests__/pools.test.ts

# Or with watch mode during development
npx vitest src/__tests__/pools.test.ts
```

### Watch mode (development)

```bash
cd apps/api
npx vitest
```

---

## Test Coverage Overview

### `packages/shared` — 22 tests

| File                     | What is tested                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `validation.test.ts`     | All Zod schemas: `createPoolSchema`, `addGameSchema`, `pickGameSchema`, `limitSchema`, `addFriendSchema`, `bulkAddFriendsSchema` |
| `pickUtils.test.ts`      | `pickWeighted` (weighted random selection, deterministic with mocked `Math.random`), `pickByIndex` (modulo wrap-around)          |
| `forbiddenWords.test.ts` | Forbidden word list is non-empty, regex matches known words case-insensitively, only matches whole words                         |

### `packages/api-client` — 21 tests

| File             | What is tested                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.test.ts` | `ApiError` (message, status, instanceof), constructor (trailing slash stripping, `steamLoginUrl`), fetch behaviour (auth header, credentials, 401 retry with refresh, auth failure callback, no infinite retry loop), all API methods (logout, refresh, getPools, createPool, pickFromPool, getLeaderboard, getOwnedGames, getRecentPicks, addGameToPool) |

### `apps/api` — 59 tests

| File              | What is tested                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `steam.test.ts`   | `buildSteamOpenIdUrl`, `verifySteamOpenId` (valid/invalid/network error), `getSteamBaseUrl` (env var vs. request URL)                                                                                                                                         |
| `session.test.ts` | `createSession`, `validateRefreshToken` (undefined/not found/expired/valid), `rotateRefreshToken`, `revokeSession`                                                                                                                                            |
| `routes.test.ts`  | `GET /health`, `GET /me` (401/200), `GET /friends` (401/200), `POST /auth/refresh` (no token/invalid/valid), `POST /auth/logout`, `GET /pools` (401/200), `GET /leaderboard`                                                                                  |
| `pools.test.ts`   | `POST /pools` (401/400/201/default name), `POST /pools/:id/games` (401/404/400/forbidden word/success), `POST /pools/:id/pick` (401/404/empty pool/success/appIds filter/avoid mode/invalid body), `GET /pools/:id/recent-picks` (401/zero limit/404/success) |
| `friends.test.ts` | `GET /friends` (401/200 with data), `POST /friends` (401/400/201/correct userId), `POST /friends/bulk` (401/400/empty array/transaction), `DELETE /friends` (401/400/by id/by steamId)                                                                        |

### `apps/web` — 7 tests

| File                 | What is tested                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BottomNav.test.tsx` | Renders nothing when logged out, renders nothing while loading, renders nav when authenticated, all 6 nav links present, `aria-current="page"` on active route, no `aria-current` on inactive links, nested route matching (`/pools/abc-123` activates Pools link) |

**Total: 109 tests across 4 packages/apps.**

---

## CI Pipeline

The CI pipeline runs on every push to `main`/`develop` and on every pull request.

**File:** `.github/workflows/ci.yml`

### Jobs

| Job            | Runner                                                     | Description                                                                                    |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `quality-gate` | `ubuntu-latest`                                            | Clean install, Linux CSS native binding verification, TypeScript checks, and all Vitest suites |
| `build-api`    | `ubuntu-latest`                                            | Builds `packages/shared` and `apps/api` to catch compile regressions                           |
| `build-web`    | Matrix (`ubuntu-latest`, `windows-latest`, `macos-latest`) | Verifies platform-native CSS bindings and runs `next build` on each OS                         |

### Why the matrix build exists

Next.js 16 + Tailwind CSS 4 rely on native `lightningcss` and `@tailwindcss/oxide` binaries during `next build`. npm can skip optional native packages on CI runners, especially on Windows and macOS. The matrix build explicitly installs and verifies the correct native package from within `apps/web` before building, so the workspace-local dependency tree used by `next build` matches the native bindings that were just installed and platform-specific regressions are caught before merge.

### Failure behaviour

The pipeline blocks the merge when any required job fails. The web build matrix uses `fail-fast: false` so one platform failure does not hide another.

---

## Pre-Release Build Pipeline

The pre-release pipeline builds all platform artifacts and publishes them as a GitHub pre-release.

**File:** `.github/workflows/release.yml`

### Triggers

- **Manual dispatch** (`workflow_dispatch`) with a `version` input (e.g. `0.2.0-beta.1`).
- **Tag push** matching `v*.*.*-*` (e.g. `v0.2.0-beta.1`).

### Jobs

| Job             | Runner                           | Description                                                 |
| --------------- | -------------------------------- | ----------------------------------------------------------- |
| `test`          | `ubuntu-latest`                  | Quality gate: type-check + all tests (same as CI)           |
| `build-api`     | `ubuntu-latest`                  | Compiles TypeScript → `apps/api/dist/`, uploads as artifact |
| `build-web`     | `ubuntu-latest`                  | `next build` → `.next/`, uploads as artifact                |
| `build-desktop` | Matrix (Linux / Windows / macOS) | Tauri binary per platform, published to GitHub release      |

### Artifacts

- **`api-dist`** — compiled Fastify backend (7-day retention).
- **`web-build`** — compiled Next.js frontend (7-day retention).
- **Desktop installers** — attached to the GitHub pre-release:
  - Linux: `.deb`, `.rpm`
  - Windows: `.msi`, `.exe`
  - macOS: `.dmg` (Apple Silicon)

> Linux AppImage bundling is currently disabled in CI because Tauri's linuxdeploy-based AppImage step is failing on modern Ubuntu GitHub runners while `.deb` and `.rpm` continue to build reliably.

> ⚠️ All releases are tagged **pre-release**. They are not deployed to production.

---

## Creating a Pre-Release

### Option A: Tag-based (recommended for team releases)

```bash
# Bump version in package.json files first, then:
git tag v0.2.0-beta.1
git push origin v0.2.0-beta.1
```

The release workflow triggers automatically.

### Option B: Manual dispatch

1. Open the **Actions** tab on GitHub.
2. Select **Pre-Release** workflow.
3. Click **Run workflow**.
4. Enter the version string (e.g. `0.2.0-beta.1`).
5. Click **Run workflow**.

---

## Versioning

The project follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`).

Pre-release versions use the format: `MAJOR.MINOR.PATCH-LABEL.N`

Examples:

- `0.2.0-alpha.1` — early internal testing
- `0.2.0-beta.1` — feature-complete, broader testing
- `0.2.0-rc.1` — release candidate

Update versions in the relevant `package.json` files before tagging.

---

## Quality Gates

The following conditions **must all pass** before a build is considered valid:

| Check                                | Tool           | Failure action                                        |
| ------------------------------------ | -------------- | ----------------------------------------------------- |
| TypeScript types                     | `tsc --noEmit` | Fails CI                                              |
| Linting                              | `next lint`    | Fails CI                                              |
| Unit / integration / component tests | Vitest         | Fails CI                                              |
| Build — API                          | `tsc`          | Fails pre-release                                     |
| Build — Web                          | `next build`   | Fails pre-release                                     |
| Build — Desktop                      | `tauri build`  | Fails pre-release (non-fatal per platform by default) |

There are no silent failures. Every step reports its exit code.

---

## Assumptions & Limitations

- **No real database in tests.** All Prisma interactions are mocked with `vi.hoisted` / `vi.mock`. Integration against a real database requires a separate test environment setup (not currently implemented).
- **No E2E tests.** Playwright/Cypress tests covering full user flows (login → pick game) are not included. These would require a running API + DB and are out of scope for this pipeline.
- **Tauri cross-compilation.** The macOS build targets `aarch64-apple-darwin` (Apple Silicon). Universal binaries (`lipo`) can be added if Intel support is needed.
- **Steam API key.** Steam API calls in tests are mocked. Real Steam integration tests are intentionally excluded as they require a valid API key and network access.
- **Next.js standalone output.** The Tauri `frontendDist` configuration references `.next/standalone`. For Tauri bundling to work correctly, the Next.js app should be built with `output: 'standalone'` in `next.config.ts`.
