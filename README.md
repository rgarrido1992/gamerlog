# Gamelog

A personal archive of the games you've played, when you played them, and how
they ended. Built with Next.js, Postgres and IGDB. Designed to live first as a
single-user app and open up to public registrations later.

---

## Stack

- **Next.js 14** (App Router, TypeScript, server components)
- **PostgreSQL** + **Prisma**
- **IGDB API** (via Twitch OAuth) for game metadata and covers
- **Tailwind CSS** + a custom design system (no AI-generic aesthetics)
- **Railway** for hosting (app + Postgres in one project)

---

## What it does

- Track games by status: **Wishlist · Pending · Started · Played · Completed**
- Mark completion type: **Main story · 100% · Abandoned**
- Filter by **release date** (month/year) and by **when you played it** (month/year)
- Per-game **play sessions** with optional duration ("no me acuerdo cuánto jugué" is a valid log)
- Multi-platform per game
- IGDB search + manual override per field

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get IGDB credentials

1. Go to <https://dev.twitch.tv/console/apps>
2. Register a new application (name it whatever, OAuth Redirect URL = `http://localhost`)
3. Copy the **Client ID** and generate a **Client Secret**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in `DATABASE_URL`, `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`.

### 4. Set up the database

```bash
npm run db:push     # creates tables from schema.prisma
npm run db:seed     # adds platforms + default user
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Deploy to Railway

1. **Push to GitHub.**
   ```bash
   git init && git add -A && git commit -m "init: gamelog"
   git remote add origin <your-repo>
   git push -u origin main
   ```

2. **Create Railway project.** <https://railway.com> → New Project → Deploy from GitHub repo.

3. **Add Postgres.** In the project, click "+ New" → Database → PostgreSQL. Railway
   wires `DATABASE_URL` automatically.

4. **Set env vars** on the Next.js service:
   - `IGDB_CLIENT_ID`
   - `IGDB_CLIENT_SECRET`
   - `SINGLE_USER_MODE=true`

5. **First deploy.** Railway runs `npm run build` (which generates the Prisma
   client) and then the start command from `railway.json`, which runs
   `prisma migrate deploy` before starting Next.

6. **Seed once.** From the Railway service shell:
   ```bash
   npm run db:seed
   ```

7. **Done.** Open the public URL Railway assigns you.

---

## Database schema

```
User           → owns many GameEntry
Game           → catalog row (IGDB cache + manual overrides)
Platform       → PS5, Switch, PC, etc. (seeded)
GameEntry      → User × Game × Platform with status, completion, dates, rating
PlaySession    → optional time logs per entry (duration nullable)
```

The status enum and completion enum mirror the brief exactly:

```
status:     WISHLIST | PENDING | STARTED | PLAYED | COMPLETED
completion:                                MAIN | HUNDRED | ABANDONED
```

---

## Roadmap

### Now (v0.1)
- ✅ Single-user mode (no auth)
- ✅ IGDB search + manual editing
- ✅ Status, completion, platform, dates, sessions
- ✅ Filters by release date and played date

### Next
- [ ] Edit / delete entries from detail page
- [ ] Stats dashboard (hours per month, completion rate, etc.)
- [ ] Tags / collections (a way to group "JRPGs", "co-op with friends"…)
- [ ] Export / import as JSON

### Opening to public
- [ ] Toggle `SINGLE_USER_MODE=false`
- [ ] Wire NextAuth (magic links to start)
- [ ] Public profile pages with `/u/<handle>`
- [ ] Privacy toggle per entry

---

## Design notes

The visual direction deliberately avoids the "AI generic" look (Inter,
glassmorphism, purple gradients). Instead:

- Dark warm background (`#0a0908`), bone foreground, single amber accent
- **Fraunces** display serif with optical sizing for headings
- **JetBrains Mono** for all metadata and UI chrome
- Subtle paper grain over the whole UI
- Covers rendered as **physical objects** with real 3D perspective tilt
  (`transform-style: preserve-3d`, no library needed)
- Editorial layout: visible typographic rules, hierarchy through size and
  weight rather than boxes

If you want a different aesthetic, the design tokens live in
`tailwind.config.ts` and `src/app/globals.css`.
