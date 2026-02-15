# MTG Hub

## Overview

MTG Hub is a Magic: The Gathering price lookup and community trading platform targeting Chinese-speaking players and local game stores. The app aggregates card prices from multiple global markets, provides card search (with plans for AI-powered natural language Chinese input), user-selectable price sources, community features (discussion, buy/sell/trade posts), and trade matching. It's designed as a mobile-first responsive web app styled to resemble a WeChat Mini Program, with a "Fantasy Heritage × Modern Interaction" visual theme inspired by MTG's medieval fantasy aesthetics.

The current state is a functional prototype/demo using mock data for cards and posts, with real database-backed features for price lists, followed cards, card browsing history, and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management / Data Fetching**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin, with CSS custom properties for theming (light/dark mode support). Custom fantasy-themed color palette with warm parchment tones and MTG-inspired gold/blue accents
- **Fonts**: ZCOOL XiaoWei (fantasy headings), Ma Shan Zheng (calligraphic), Noto Sans SC (UI body text), JetBrains Mono (monospace/prices) — loaded via Google Fonts
- **Layout**: Mobile-first, constrained to 500px max-width, with a sticky header and fixed bottom tab navigation (4 tabs: Home/发现, Library/卡牌库, Community/社区, Me/我的)
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Backend

- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via tsx
- **API Style**: RESTful JSON API, all routes prefixed with `/api/`
- **Development**: Vite dev server middleware is integrated into Express for HMR during development
- **Production**: Client is built with Vite to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### API Routes

- `GET/POST /api/cards` — Card CRUD (currently seeded with mock data)
- `GET /api/posts` — Community posts
- `GET/POST/PATCH/DELETE /api/price-lists` — User-created price lists
- `GET/POST/PATCH/DELETE /api/price-lists/:id/items` — Items within price lists
- `GET/POST/DELETE /api/followed-cards` — Cards the user is tracking
- `GET/POST /api/card-history` — Browsing history for viewed cards

### Database

- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location**: `shared/schema.ts` — shared between client and server
- **Migrations**: Managed via `drizzle-kit push` (no migration files committed, uses push strategy)
- **Connection**: `pg` Pool in `server/db.ts`

### Key Database Tables

- `users` — id, username, avatar, dci_number
- `cards` — id, scryfall_id, name_en, name_cn, image_uri, set_code, collector_number, prices (JSONB)
- `posts` — id, userId, content, type (discussion/sell/buy/trade), cardId, likes, comments, createdAt
- `user_cards` — id, userId, cardId, isWishlist, count
- `price_lists` — user-created named lists for organizing cards
- `price_list_items` — items in price lists with quantity, condition, notes, mock card references
- `followed_cards` — cards being tracked/watched
- `card_history` — browsing history entries with timestamps

### Data Pattern

The app currently uses a hybrid approach: mock data (`client/src/lib/mock-data.ts`) for card display and browsing, while price lists, followed cards, and history are persisted in the database. Cards in the mock data include famous MTG cards (Black Lotus, etc.) with prices in USD, CNY, and JPY.

### Build Process

- **Development**: `npm run dev` starts the Express server with Vite middleware for HMR
- **Production build**: `npm run build` runs `script/build.ts` which builds the client with Vite and the server with esbuild, bundling key dependencies to reduce cold start times
- **Database sync**: `npm run db:push` pushes schema to database

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connected via `DATABASE_URL` environment variable. Used for all persistent data storage.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express**: HTTP server framework (v5)
- **@tanstack/react-query**: Client-side data fetching and caching
- **wouter**: Lightweight client-side routing
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, clsx, tailwind-merge
- **zod** + **drizzle-zod**: Schema validation shared between client and server
- **recharts**: Charting library (for price history visualization)
- **react-day-picker**: Calendar component
- **embla-carousel-react**: Carousel component
- **vaul**: Drawer component
- **date-fns**: Date utility library

### External APIs (Planned/Referenced)
- **Scryfall**: Card data source (referenced in schema via `scryfall_id` field, card images served from `cards.scryfall.io`)
- **Google Fonts**: Font loading for ZCOOL XiaoWei, Ma Shan Zheng, Noto Sans SC, JetBrains Mono

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay during development
- **@replit/vite-plugin-cartographer**: Development tooling (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)
- **vite-plugin-meta-images**: Custom plugin for OpenGraph meta tag management on Replit deployments