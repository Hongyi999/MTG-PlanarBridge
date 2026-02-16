# MTG Hub

## Overview
A multi-game TCG (Trading Card Game) card management hub supporting **Magic: The Gathering (MTG)** and **Flesh and Blood (FAB)**. Integrates data from multiple sources with card search, price tracking, user collections, and community posts.

## Data Sources
- **MTG**: Scryfall bulk data, TCGTracking (free price API)
- **FAB**: GitHub repo (the-fab-cube/flesh-and-blood-cards)
- **Future**: JustTCG (requires API key), FaBDB, TCGCSV

## Project Architecture
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Radix UI components
- **Backend**: Express 5 (TypeScript via tsx)
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client-side), Express (server-side API)
- **State Management**: TanStack React Query

## Project Structure
```
client/          - React frontend (Vite)
  src/
    components/  - UI components (mtg-card.tsx handles both games)
    hooks/       - Custom React hooks
    lib/         - Utilities (game-context.tsx, api.ts)
    pages/       - Page components
  public/        - Static assets
server/          - Express backend
  index.ts       - Server entry point
  routes.ts      - API routes
  db.ts          - Database connection
  storage.ts     - Data access layer
  import-mtg.ts  - Scryfall bulk import script
  import-fab.ts  - FAB GitHub repo import script
  import-prices.ts - TCGTracking price updater
  vite.ts        - Vite dev middleware
  static.ts      - Production static file serving
shared/          - Shared code (schema)
  schema.ts      - Drizzle ORM schema (unified cards table)
script/          - Build scripts
  build.ts       - Production build (esbuild + vite)
attached_assets/ - Design assets
```

## Database Design
- **Unified `cards` table**: Single table for both MTG and FAB cards with `game` discriminator column
- **JSONB fields**: `mtgData` for MTG-specific data, `fabData` for FAB-specific data
- **Unique constraint**: `(game, external_id)` composite unique index prevents duplicates
- **Import system**: Batch processing with 500-card chunks, progress tracked via `importJobs` table

## Key Commands
- `npm run dev` - Start dev server (port 5000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database

## Key Features
- Game selector in header (MTG/FAB switch, persisted in localStorage)
- Card search with pagination and game filtering
- Card import from external data sources (triggered from home page)
- Price tracking with multi-source display
- Price lists (collections management with export)
- Community posts (discussions, buy/sell/trade)
- Card browsing history

## Environment
- Node.js 20
- PostgreSQL (DATABASE_URL environment variable)
- Port 5000 (frontend + backend served together)

## Recent Changes
- 2026-02-16: Redesigned database schema with unified cards table supporting both MTG and FAB
- 2026-02-16: Built server-side import scripts for Scryfall (MTG) and GitHub repo (FAB)
- 2026-02-16: Added TCGTracking price fetcher for MTG cards
- 2026-02-16: Implemented frontend game selector and replaced all mock data with real API calls
- 2026-02-16: Added unique constraint on (game, external_id) for data integrity
