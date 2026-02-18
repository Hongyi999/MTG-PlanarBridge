# MTG PlanarBridge

**A multi-game TCG price lookup and community platform for Magic: The Gathering and Flesh and Blood.**

Built for Chinese-speaking players and local game stores (LGS). Mobile-first design with real-time multi-source pricing, smart Chinese search, community trading, and direct messaging.

---

## Features

### Multi-Game Support

Switch between **Magic: The Gathering** and **Flesh and Blood** from the header dropdown. The library, search, and card detail views adapt to the selected game.

### MTG Card Search & Pricing

- **Scryfall API** proxy with rate limiting (10 req/s) and 24-hour local cache
- **Smart Chinese search** — Chinese queries auto-prepend `lang:zhs`; natural language converts to Scryfall syntax (e.g., `3费以下的绿色生物` → `cmc<=3 color:G type:creature`)
- **Advanced filters**: name, rules text, type, set, rarity, color, CMC, format legality, artist, language
- **Autocomplete** for card names
- Paginated results with "load more"

### FAB Card Search & Pricing

- **~4,200+ cards** loaded from the [flesh-and-blood-cards](https://github.com/the-fab-cube/flesh-and-blood-cards) repository (Git submodule)
- **In-memory cache** with indexes by UUID, name, and printing identifier — search latency ~0.4ms
- **Live TCGPlayer prices** (normal + foil) fetched from [TCGCSV](https://tcgcsv.com) across all FAB sets, refreshed every 24 hours
- Card detail shows all printings with pitch color coding, foiling types, and TCGPlayer links

### Multi-Source Price System

| Source | Data | Auth Required |
|--------|------|:---:|
| **Scryfall** | USD, EUR, TIX prices + card data | No |
| **TCGTracking** | Condition-specific USD (NM/LP/MP/HP/DMG) | No |
| **TCGCSV** | TCGPlayer mirror for FAB prices | No |
| **JustTCG** | Multi-source pricing + price history | Optional API key |
| **Wisdom Guild** | Japanese market JPY prices | Optional API key |

- **Automatic snapshots** every 6 hours for all followed cards
- **Immediate snapshot** when a card is followed
- **Price history chart** (Recharts) on card detail pages
- Exchange rates stored alongside each snapshot for historical accuracy

### Multi-Currency Display

- Native: USD, EUR, TIX (from Scryfall)
- Converted: CNY and JPY via configurable exchange rates (defaults: 1 USD = 7.25 CNY, 1 USD = 150 JPY)
- Rates adjustable via settings API

### Price Lists

- Create named lists (wishlist, sell list, collection watchlist)
- Add cards with quantity, condition, notes, and prices in USD/CNY/JPY
- Full CRUD for lists and items

### Authentication

- Phone number + SMS OTP login (Chinese mobile numbers)
- Auto-registration on first login
- WeChat nickname support
- 30-day session cookies
- Auto-generated DiceBear avatars

### Community & Messaging

- Post types: discussion, sell, buy, trade
- Up to 9 image attachments per post (5MB each)
- Optional linked card with reference price
- Like system
- **Direct messaging** with unread counts and mark-as-read

### Card View History

- Tracks recently viewed cards (deduplicated, most recent first)

---

## Tech Stack

### Frontend

- **React 19** + TypeScript
- **Vite 7** — build tool and dev server
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** (Radix UI) — 40+ UI components
- **TanStack React Query 5** — server state management
- **wouter** — lightweight client-side routing
- **Framer Motion** — animations
- **Recharts** — price history charts
- **react-hook-form** + **zod** — form validation

### Backend

- **Express 5** (Node.js, ESM)
- **PostgreSQL** + **Drizzle ORM** — type-safe database layer
- **express-session** — session management
- **multer** — image upload handling

### External APIs

- [Scryfall](https://scryfall.com/docs/api) — MTG card data and prices
- [TCGTracking](https://tcgtracking.com/tcgapi/) — condition-specific TCGPlayer prices
- [TCGCSV](https://tcgcsv.com) — free TCGPlayer price mirror (FAB prices)
- [JustTCG](https://justtcg.com/docs) — price history (optional)
- [Wisdom Guild](http://wonder.wisdom-guild.net/) — Japanese market JPY prices (optional)

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
git clone https://github.com/Hongyi999/MTG-PlanarBridge.git
cd MTG-PlanarBridge

# Initialize FAB cards submodule
git submodule update --init --recursive

# Install dependencies
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mtg_planar_bridge
PORT=5000

# Optional: JustTCG price history
JUSTTCG_API_KEY=

# Optional: Japanese market prices (Wisdom Guild)
WISDOMGUILD_API_KEY=
WISDOMGUILD_SECRET_KEY=
```

### Database Setup

```bash
npm run db:push
```

### Development

```bash
npm run dev
```

Open `http://localhost:5000`. The server serves both the API and the Vite-powered frontend.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
MTG-PlanarBridge/
├── client/                         # React frontend
│   └── src/
│       ├── pages/                  # Route pages
│       │   ├── home.tsx            # Discovery — trending cards, community picks
│       │   ├── library.tsx         # Card search (MTG + FAB) with advanced filters
│       │   ├── card-detail.tsx     # MTG card detail — prices, history chart
│       │   ├── fab-card-detail.tsx # FAB card detail — printings, TCGPlayer prices
│       │   ├── community.tsx       # Community feed (buy/sell/trade/discussion)
│       │   ├── create-post.tsx     # Create a community post
│       │   ├── price-lists.tsx     # Price list management
│       │   ├── card-history-page.tsx # Recently viewed cards
│       │   ├── chat.tsx            # Direct messaging
│       │   ├── login.tsx           # Phone + OTP login
│       │   ├── me.tsx              # User profile and settings
│       │   └── not-found.tsx       # 404
│       ├── components/             # UI components (shadcn/ui + custom)
│       │   ├── mtg-card.tsx        # Card display (grid/list variants)
│       │   └── price-history-chart.tsx # Price history line chart
│       ├── hooks/                  # Custom hooks
│       │   ├── use-auth.tsx        # Auth context (login, logout, session)
│       │   ├── use-game.tsx        # Game switcher (MTG / FAB)
│       │   └── use-theme.ts       # Dark/light mode
│       └── lib/
│           ├── api.ts              # API client helpers
│           └── smart-search.ts     # Chinese natural language → Scryfall syntax
├── server/                         # Express backend
│   ├── index.ts                    # Entry point, startup scheduling
│   ├── routes.ts                   # All API routes
│   ├── storage.ts                  # Database operations (Drizzle ORM)
│   ├── db.ts                       # PostgreSQL connection
│   ├── scryfall.ts                 # Scryfall API proxy (rate-limited)
│   ├── tcgtracking.ts             # TCGTracking API client
│   ├── tcgcsv.ts                  # TCGCSV API client (FAB prices)
│   ├── justtcg.ts                 # JustTCG API client (optional)
│   ├── wisdom-guild.ts            # Wisdom Guild API client (optional)
│   ├── price-snapshot.ts          # Multi-source price snapshot scheduler
│   ├── fab-cards-cache.ts         # In-memory FAB card database
│   ├── fab-cards-types.ts         # FAB TypeScript types
│   ├── fab-price-cache.ts         # FAB TCGPlayer price cache (via TCGCSV)
│   └── fab-cards-data/            # Git submodule: flesh-and-blood-cards
├── shared/
│   └── schema.ts                  # Drizzle ORM schema + Zod validators
├── drizzle.config.ts              # Drizzle Kit configuration
└── package.json
```

---

## API Reference

### MTG Cards (Scryfall Proxy)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/search?q=&page=` | Search cards (auto-detects Chinese) |
| GET | `/api/cards/autocomplete?q=` | Card name autocomplete |
| GET | `/api/cards/scryfall/:scryfallId` | Get card by Scryfall UUID (24h cache) |
| GET | `/api/cards/named?name=&exact=` | Get card by name |

### FAB Cards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fab/cards/search?q=&page=` | Search FAB cards (in-memory) |
| GET | `/api/fab/cards/:identifier` | Get FAB card by printing ID (e.g., `MST131`) |
| GET | `/api/fab/price-cache/status` | Price cache status |
| POST | `/api/fab/price-cache/refresh` | Force-refresh FAB prices |

### Price Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/followed-cards` | List followed cards |
| POST | `/api/followed-cards` | Follow a card (triggers snapshot) |
| DELETE | `/api/followed-cards/:id` | Unfollow a card |
| GET | `/api/price-history/:scryfallId?days=90` | Price history time series |
| GET | `/api/price-history/:scryfallId/latest?source=` | Latest price snapshot |
| POST | `/api/price-history/snapshot` | Trigger manual snapshot |

### Price Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/price-lists` | List all price lists |
| POST | `/api/price-lists` | Create a price list |
| PATCH | `/api/price-lists/:id` | Update a price list |
| DELETE | `/api/price-lists/:id` | Delete a price list |
| GET | `/api/price-lists/:listId/items` | List items in a price list |
| POST | `/api/price-lists/:listId/items` | Add item to a price list |
| PATCH | `/api/price-list-items/:id` | Update a list item |
| DELETE | `/api/price-list-items/:id` | Remove a list item |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-code` | Send SMS verification code |
| POST | `/api/auth/login` | Login / auto-register with phone + code |
| GET | `/api/auth/me` | Get current session user |
| PATCH | `/api/auth/profile` | Update profile |
| POST | `/api/auth/logout` | Logout |

### Community & Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community-posts` | List community posts |
| POST | `/api/community-posts` | Create a post |
| POST | `/api/community-posts/:id/like` | Like a post |
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/:userId` | Get messages with a user |
| POST | `/api/messages` | Send a message |
| GET | `/api/users/search?q=` | Search users |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exchange-rates` | Get exchange rates |
| PUT | `/api/exchange-rates` | Update exchange rates |
| GET | `/api/settings/:key` | Get a setting |
| PUT | `/api/settings/:key` | Set a setting |
| POST | `/api/upload` | Upload images (up to 9, 5MB each) |

---

## Database Schema

Managed via Drizzle ORM. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (phone, username, WeChat nickname, avatar) |
| `cards` | Local MTG card cache (from Scryfall) |
| `price_history` | Multi-source price snapshots with exchange rates at time of recording |
| `price_lists` / `price_list_items` | User-managed price lists |
| `followed_cards` | Cards followed for price tracking |
| `card_history` | Recently viewed cards |
| `community_posts` | Community posts (discussion/sell/buy/trade) |
| `messages` | Direct messages between users |
| `verification_codes` | SMS OTP codes (5-min TTL) |
| `user_settings` | Key-value settings (exchange rates, preferences) |

Run `npm run db:push` to sync schema to your database.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full-stack dev server (API + Vite HMR on port 5000) |
| `npm run build` | Production build (esbuild server + Vite client) |
| `npm start` | Run production build |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push Drizzle schema to PostgreSQL |

---

## Background Jobs

The server runs several scheduled tasks:

| Job | Interval | Description |
|-----|----------|-------------|
| MTG price snapshot | Every 6 hours | Snapshots prices for all followed cards from all configured sources |
| FAB card data reload | Every 24 hours | Reloads FAB card data from the Git submodule JSON files |
| FAB price refresh | Every 24 hours | Refreshes TCGPlayer prices for all FAB sets via TCGCSV |

An initial MTG price snapshot runs 30 seconds after server startup. FAB prices load in the background on startup (non-blocking).

---

## Optional API Keys

The app works without any API keys using Scryfall + TCGTracking + TCGCSV as free data sources. Optional keys unlock additional features:

### JustTCG (recommended, 5 minutes to set up)

1. Register at [justtcg.com](https://justtcg.com)
2. Go to Dashboard → API Settings → Generate key
3. Add to `.env` as `JUSTTCG_API_KEY`

### Wisdom Guild (optional, Japanese market)

1. Register at [wonder.wisdom-guild.net](http://wonder.wisdom-guild.net/)
2. Contact the admin to request API access
3. Add `WISDOMGUILD_API_KEY` and `WISDOMGUILD_SECRET_KEY` to `.env`

---

## Acknowledgments

- MTG card data provided by [Scryfall](https://scryfall.com/). Scryfall is not produced by or endorsed by Wizards of the Coast.
- FAB card data from [the-fab-cube/flesh-and-blood-cards](https://github.com/the-fab-cube/flesh-and-blood-cards).
- FAB prices from [TCGCSV](https://tcgcsv.com), a free TCGPlayer data mirror.
- Magic: The Gathering is a trademark of Wizards of the Coast LLC.
- Flesh and Blood is a trademark of Legend Story Studios.

## License

MIT
