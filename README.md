# MemoryCard

A personal archive of the games you play. Track status, time, scores, and curate
your own lists. Built with Next.js, PostgreSQL, IGDB and OpenCritic.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL** + **Prisma**
- **IGDB API** for game catalog (covers, artwork, screenshots, trailer, similar games, platforms)
- **OpenCritic API** (via RapidAPI) for critic scores
- **Tailwind CSS** with custom design tokens
- **Railway** for hosting

## What it does

- Track games by status: Wishlist · Pending · Started · Played · Completed
- Completion type: Main story · 100% · Abandoned
- Per-game play sessions, with optional duration ("don't remember" is valid)
- Per-game personal rating (0-100) → community average is computed from all users
- OpenCritic score + IGDB rating cached on the game
- Filter library by status, platform, release year/month, played year/month
- Custom lists (e.g. "My favorite LEGO games") — add/remove games, edit, delete
- Game detail page with hero artwork, YouTube trailer, screenshots, similar games
- Platforms shown as branded badges (PS5 blue, Xbox green, Switch red, etc.)
- When adding a game, only platforms the game is actually available on are shown

## Local setup

```bash
npm install
cp .env.example .env
# fill DATABASE_URL, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET, OPENCRITIC_RAPIDAPI_KEY
npm run db:push
npm run db:seed
npm run dev
```

## Deploy to Railway

1. Push to GitHub.
2. Create Railway project from GitHub repo.
3. Add PostgreSQL plugin.
4. In the app service Variables:
   - `DATABASE_URL` → add as Reference to `${{Postgres.DATABASE_URL}}`
   - `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` → from dev.twitch.tv
   - `OPENCRITIC_RAPIDAPI_KEY` → from rapidapi.com (optional)
   - `SINGLE_USER_MODE` → `true`
5. After first deploy, run migrations + seed via Railway CLI:
   ```bash
   railway link
   $env:DATABASE_URL="<DATABASE_PUBLIC_URL from Postgres>"
   npx prisma db push
   npm run db:seed
   ```

## Updating from v1 (gamelog → memorycard)

Schema changes are additive. Just push the new schema:

```bash
$env:DATABASE_URL="<your public Railway DB URL>"
npx prisma db push --accept-data-loss
npm run db:seed
```

The seed updates existing platforms with badge info and adds new ones. Your existing
entries and games remain intact. Games won't have IGDB-pulled artwork/screenshots/trailer
until you re-add them, but the app handles missing fields gracefully.

## Design

Direction: PlayStation/Xbox-style modern console dashboard. Dark background with
subtle gradient mesh, cyan accent for interactive elements, large tiles with hover
glow, status chips with colored dots, platform badges as branded chips. Tile cover
art is the hero on the home page; the game detail page goes full Netflix with
artwork hero, ratings cluster, and horizontal scroll rows for screenshots and
similar games.
