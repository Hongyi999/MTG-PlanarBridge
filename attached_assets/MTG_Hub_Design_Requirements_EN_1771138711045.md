# MTG Hub — Design & Development Requirements

> **Purpose:** This document is a technical design requirement for building a functional demo/prototype on Replit.  
> **Target Platform:** WeChat Mini Program (demo can be built as a responsive web app first)  
> **Version:** 1.0 Demo Spec  
> **Date:** February 15, 2026

---

## 1. Product Overview

**MTG Hub** is a price lookup and community trading platform for Magic: The Gathering players and local game stores (LGS) in China. The platform aggregates card prices from multiple global markets (US, Japan, China), supports natural language search powered by AI, and provides a community space for discussion and peer-to-peer trade matching.

### Core Value Proposition

- Multi-source price aggregation with transparent data labeling
- AI-powered natural language card search (Chinese input)
- User-selectable price sources with preset templates
- Community features: discussion, buy/sell/trade posts with embedded card components
- Trade matching (platform does NOT handle payments — matchmaking only)

---

## 2. UI/UX Design Direction

### 2.1 Design Style

**"Fantasy Heritage × Modern Interaction"** — inspired by MTG's medieval fantasy aesthetics while maintaining a modern, clean app experience.

Key visual elements:
- Parchment-like subtle textures on backgrounds
- Gothic/medieval-style display fonts for headings; clean sans-serif for body text
- Hand-drawn style mana symbols as navigation icons
- MTG five-color system (White/Blue/Black/Red/Green) as the foundation of the color palette
- Card components with rounded corners and subtle emboss/shadow effects simulating physical card feel
- Decorative elements: vine, rune, and filigree patterns as dividers and ornaments

### 2.2 Theme System

**The app supports both Light and Dark themes, with Light as the default.**

Users can toggle between themes via a switch in Settings.

#### Light Theme (Default)

| Element | Value |
|---------|-------|
| Background (primary) | `#FAF8F5` (warm off-white, slight parchment feel) |
| Background (secondary/cards) | `#FFFFFF` |
| Background (tertiary/sections) | `#F0EDE8` |
| Text (primary) | `#1A1A1A` |
| Text (secondary) | `#6B6B6B` |
| Text (muted/caption) | `#9E9E9E` |
| Border/divider | `#E0DCD5` |
| Accent (primary) | `#8B6914` (antique gold) |
| Accent (interactive) | `#2E5A88` (deep blue) |
| Success / price up | `#2D8F4E` |
| Danger / price down | `#C0392B` |
| Warning | `#D4A017` |

#### Dark Theme

| Element | Value |
|---------|-------|
| Background (primary) | `#1A1714` (deep warm brown-black) |
| Background (secondary/cards) | `#252220` |
| Background (tertiary/sections) | `#302C28` |
| Text (primary) | `#E8E4DE` |
| Text (secondary) | `#A09A90` |
| Text (muted/caption) | `#6B665E` |
| Border/divider | `#3D3935` |
| Accent (primary) | `#D4A937` (bright gold) |
| Accent (interactive) | `#5B9BD5` (lighter blue) |
| Success / price up | `#4CAF50` |
| Danger / price down | `#E74C3C` |
| Warning | `#F0C040` |

#### MTG Color Accents (Consistent Across Themes)

| MTG Color | Light Theme | Dark Theme | Usage |
|-----------|------------|------------|-------|
| White (Plains) | `#F9F3E3` | `#C8B888` | Card type tags, filters |
| Blue (Island) | `#1E78C8` | `#5BA3E0` | Card type tags, filters |
| Black (Swamp) | `#3B3B3B` | `#8A8A8A` | Card type tags, filters |
| Red (Mountain) | `#D32029` | `#E85D5D` | Card type tags, filters |
| Green (Forest) | `#00783E` | `#4CAF50` | Card type tags, filters |
| Multicolor | `#CFB53B` | `#E0C860` | Gold accent |
| Colorless | `#A8A8A8` | `#B0B0B0` | Artifact/land indicators |

### 2.3 Typography

| Usage | Font | Size | Weight |
|-------|------|------|--------|
| App title / Logo | Cinzel or Playfair Display (serif/gothic) | 24-28px | Bold |
| Section headings | Cinzel or system serif | 18-20px | SemiBold |
| Subheadings | System sans-serif | 15-16px | SemiBold |
| Body text | System sans-serif (PingFang SC / SF Pro) | 14px | Regular |
| Caption / metadata | System sans-serif | 12px | Regular |
| Price numbers | SF Mono / Menlo / monospace | 16-20px | SemiBold |

### 2.4 Micro-interactions & Animations (Polish Phase — Lower Priority for Demo)

- **Card flip:** 3D flip animation when tapping into card detail view
- **Favorite/follow:** Magic particle burst effect on tap
- **Price spike/crash:** Card border glow (gold flash for spike, red pulse for crash)
- **Pull-to-refresh:** Mana orb spinning animation
- **Loading state:** MTG card back rotating as spinner
- **Achievement badges:** Unlock animation when milestones are reached
- **First-time onboarding:** "Planeswalker Initiation" themed guide

For the demo, simple fade/slide transitions are sufficient. Fancy animations are a nice-to-have.

---

## 3. Information Architecture

### 3.1 Tab Bar Structure (4 Tabs)

```
┌──────────┬──────────┬──────────┬──────────┐
│  Home/   │  Card    │Community │   Me     │
│ Discover │ Library  │          │          │
│  🏠      │  🔮      │  💬      │  👤      │
└──────────┴──────────┴──────────┴──────────┘
```

### 3.2 Page Hierarchy

```
Tab 1: Home / Discover
├── Search bar (global entry point)
├── Hot price movers (Top gainers / losers)
├── Featured community posts
├── Quick access to recent searches
└── Trending hashtags

Tab 2: Card Library
├── AI Chat Search interface (primary)
├── Category browse (by set, color, type)
├── Advanced filter panel
├── Search results → Card detail page
│   ├── Card info (image, name, mana, type, text)
│   ├── Price panel (multi-source, user-selected)
│   ├── Price history chart
│   ├── Add to list / deck
│   └── Follow / price alert
└── Price comparison view

Tab 3: Community
├── Feed (tabs: All / Discussion / Selling / Buying / Trading / Showcase)
├── Post detail → comments, likes, share
├── Create post (select type → compose → publish)
├── User profile (from post author tap)
└── Private chat (from post or profile)
    ├── Text / image / voice messages
    ├── Send card component
    └── Trade confirmation flow

Tab 4: Me
├── My collections (card inventory)
├── My price lists
├── My decks
├── My trades (history + active)
├── My posts
├── Messages / notifications
└── Settings
    ├── Theme toggle (Light / Dark)
    ├── Price source management
    ├── Currency preference
    ├── Notification preferences
    └── Account & privacy
```

---

## 4. Core Feature Specifications

### 4.1 Card Database & Price Lookup

#### Data Architecture (Two-Layer Design)

| Layer | Responsibility | Source |
|-------|---------------|--------|
| **Card Info Layer** | Name (CN/EN/JP), image, mana cost, colors, type, rarity, set, oracle text, legalities | Scryfall API (free, authoritative) |
| **Price Data Layer** | Market prices by source, condition, version | Multi-source aggregation |

#### Price Sources by Market

**US Market (USD) — V1.0 Priority:**

| Priority | Source | Access Method | Update Freq | Notes |
|----------|--------|--------------|-------------|-------|
| P0 | TCGPlayer (via JustTCG) | JustTCG REST API | ~6 hours | Primary US price benchmark. Supports condition-specific pricing (NM/SP/MP/HP). Free tier available, paid plans for higher volume |
| P1 | Scryfall Price | Scryfall API (free) | Daily | Fallback/trend reference. Derived from TCGPlayer + Cardmarket daily snapshots |

**Japan Market (JPY) — V1.5:**

| Priority | Source | Access Method | Update Freq | Notes |
|----------|--------|--------------|-------------|-------|
| P0 | Hareruya (晴屋) | Web scraping / business partnership | 1-2x daily | Japan's largest MTG retailer, industry pricing benchmark |
| P1 | TokyoMTG | Web scraping | Daily | Secondary Japan source |

**China Market (CNY) — V2.0:**

| Priority | Source | Access Method | Update Freq |
|----------|--------|--------------|-------------|
| P0 | Aggregated (self-built) | Scraping + user-reported prices | 2-4x daily |
| P1 | Platform community prices | In-app sell/buy post prices | Real-time |
| P2 | LGS partner prices | Store-submitted via merchant portal | Real-time |

#### Price Display Requirements

Each price data point MUST include:
- **Source name** (e.g., "TCGPlayer", "Hareruya")
- **Price type** (Market / Low / Retail / Buylist)
- **Last updated timestamp** (relative, e.g., "6h ago", "Today 09:30")
- **Original currency + converted amount** (e.g., "¥1,480 JPY ≈ ¥71.2 CNY")
- **Price change indicator** (↑3.2% / ↓1.5% with color coding)
- **Condition/version** (NM / Foil, if available from source)
- **Reliability badge:** 🟢 Direct API / 🟡 Derived / 🔴 Community/Scraped

#### User-Selectable Price Sources

Users can configure which price sources to display via Settings > Price Source Management:
- Checkbox list of available sources per market
- Drag to reorder display priority
- Preset templates for quick setup:
  - 🎮 Competitive Player: TCGPlayer + Hareruya
  - 🏪 Store Owner: TCGPlayer + Hareruya + CardKingdom + CN aggregate
  - 💎 Collector/Investor: All available sources
  - 🇨🇳 Casual (CN): Scryfall fallback + CN aggregate

V1.0 demo: Show all available sources by default, label each clearly. User-selectable toggle is a V1.5 feature but UI placeholder should exist.

#### Card Detail Page Layout

```
┌─────────────────────────────────────┐
│         [Card Image - High Res]      │
│         (tap to zoom / flip)         │
├─────────────────────────────────────┤
│  Card Name (CN)                      │
│  Card Name (EN) · Card Name (JP)     │
│  {W}{U}{B} · Instant · Rare         │
│  Set: Modern Horizons 3 · #142       │
├─────────────────────────────────────┤
│  Oracle Text                         │
│  "Counter target spell..."           │
│  Flavor Text (italic)               │
├─────────────────────────────────────┤
│  Legality: Standard ✅ Modern ✅     │
│            Pioneer ✅ Commander ✅    │
├─────────────────────────────────────┤
│  💰 PRICES                          │
│  ┌─ 🇺🇸 US Market ──────────────┐  │
│  │ 🟢 TCGPlayer  $12.50 Mkt ↑3% │  │
│  │              $10.80 Low       │  │
│  │ 🟡 Scryfall   $12.30    ↑2%  │  │
│  │ ⏱ Updated: 3h ago / today    │  │
│  └───────────────────────────────┘  │
│  ┌─ 🇯🇵 Japan Market ───────────┐  │
│  │ 🟢 Hareruya ¥1,480     ↓1.5% │  │
│  │   ≈ ¥71.2 CNY                │  │
│  │ ⏱ Updated: today 09:30       │  │
│  └───────────────────────────────┘  │
│  ┌─ 🇨🇳 China Market ───────────┐  │
│  │ 🔴 Aggregated  ¥85     ↑5%   │  │
│  │ ⏱ Updated: today 14:00       │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│ [📊 Price History] [🔔 Set Alert]   │
│ [➕ Add to List]   [❤️ Follow]      │
│ [⚙️ Manage Sources]                 │
└─────────────────────────────────────┘
```

### 4.2 AI Natural Language Search

Users can type natural language queries in Chinese to search for cards. The system uses LLM for intent recognition and entity extraction, then maps to Scryfall search syntax.

#### Example Queries

| User Input (Chinese) | Parsed Intent | Action |
|----------------------|---------------|--------|
| "查一下近代赛能用的红色烧牌" | format=modern, color=red, type=instant/sorcery, keyword=damage | Return filtered card list with prices |
| "黑莲花现在多少钱" | card_name=Black Lotus | Return price across all markets |
| "标准赛制下50元以内的白色结界" | format=standard, color=white, type=enchantment, price≤50CNY | Return filtered + sorted results |
| "把Force of Will加到我的清单" | card_name=Force of Will, action=add_to_list | Add card to active price list |
| "对比几张反击咒语的价格" | action=compare, type=instant, keyword=counter | Show comparison view |

#### Search UI Design

- Chat-style input box at top of Card Library tab
- Support voice input (microphone icon)
- AI responses rendered as interactive card components (not plain text)
- Each result card has quick-action buttons: [Add to List] [View Detail] [Compare]
- Context-aware follow-ups supported (e.g., "再找几张类似的" = "find more like these")
- When ambiguous, AI asks clarifying questions (e.g., "Did you mean Force of Will or Force of Negation?")

### 4.3 Price Lists & Export

#### List Management
- Users can create multiple named lists (e.g., "Buy List", "Sell List", "Watchlist")
- Cards can be added via: natural language command, search result action button, or manual add
- Each list shows: card entries with latest price, quantity, subtotal, and list total value
- Support quantity adjustment, condition/version notes per entry
- Drag to reorder or move between lists

#### Export
- Formats: Image (for WeChat sharing), Excel/CSV, PDF
- Customizable fields: name, price, quantity, subtotal, source, condition
- Auto-generated timestamp watermark
- Shareable link / QR code (read-only view for recipients)

### 4.4 Price Tracking & Alerts

- Follow button on any card detail page
- Price alert rules: notify when price drops below / rises above threshold
- Daily/weekly digest: summary of price changes for followed cards
- Spike alert: instant notification when 24h change exceeds ±15% (configurable)
- Hot movers leaderboard: Top cards by price change (gainers & losers)

### 4.5 Deck Builder

- Create / import decks (paste text in MTGO/Arena format)
- Auto-calculate total deck value across all markets
- Mana curve visualization (bar chart)
- Color distribution (pie chart)
- Format legality check
- Export as text list, visual deck image, or PDF
- Share via link or card

### 4.6 Collection & Inventory

#### Personal Collection (Players)
- Log owned cards: card, quantity, condition, version/printing
- Real-time total collection value with trend
- Browse by set, color, value
- One-tap publish as sell post in community

#### Inventory Management (Stores — V3.5)
- Bulk import via Excel template or barcode scan
- Low stock alerts
- Market price reference for pricing decisions
- Inventory synced to store's public product page

### 4.7 Community

#### Post Types

| Type | Icon | Color | Description | Special Features |
|------|------|-------|-------------|-----------------|
| Discussion | 💬 | Blue `#2E5A88` | General discussion, rules Q&A, meta analysis | Poll support, hashtags |
| Selling | 💰 | Green `#2D8F4E` | User selling cards | Embedded card component + price + condition tag |
| Buying | 🔍 | Orange `#E67E22` | User wants to buy | Embedded card component + desired price |
| Trading | 🔄 | Purple `#8E44AD` | User wants to trade | Dual card components (offering / wanting) |
| Showcase | ✨ | Gold `#D4A017` | Show off collection, pack openings | Photo/video + card recognition link |

#### Post Features
- Rich text + image + embedded card component
- Like, comment, repost, bookmark
- Trade posts: "Sold" / "Acquired" status toggle to close deal
- Card component in posts: shows card image, name, current market reference price; tappable to card detail

#### Feed & Discovery
- Home feed: Following + Hot + Algorithmic recommendation
- Filter tabs by post type
- Hashtag system (#StandardMeta #CommanderPicks #PackOpening)
- Full-text search across posts and card names
- Trending topics board

#### User System & Trust
- Profile: avatar, nickname, bio, trade rating, trade count
- Credit score: based on completion rate, peer reviews, activity
- Verification badges: Real-name verified, LGS verified, Veteran player
- Report mechanism: flag posts/users, manual review
- Block/blacklist

### 4.8 Trade Matching System

**Model: Matchmaking only. Platform does NOT handle money.**

#### Trade Flow
1. Seller publishes sell post with card info + asking price
2. Buyer finds post, comments or sends private message
3. Both negotiate in private chat: price, condition (with photo proof), shipping
4. Buyer initiates "Trade Confirmation" in chat — generates trade record
5. Payment happens OUTSIDE the platform (WeChat Pay / Alipay face-to-face transfer)
6. Seller ships; buyer confirms receipt
7. Both leave reviews; credit scores updated

#### Trade Safeguards
- Full chat history retained as dispute evidence
- Standardized condition guide (NM/SP/MP/HP/D) with visual reference
- Mutual review system (positive/neutral/negative + text)
- Dispute mediation channel (human CS)
- Risk warning: low-credit users flagged before transaction

### 4.9 Private Chat

- 1-on-1 real-time messaging: text, image, voice
- Send card component from library (select card → send as rich message)
- Cloud-synced chat history
- Unread badge notifications

#### Trade Confirmation (in-chat)
- Initiate "Trade Confirmation" (similar to WeChat Pay transfer UX)
- Select card(s), fill amount, quantity, condition
- Generates confirmation card; counterparty accepts to create trade record
- Trade status tracker: Pending → Confirmed → Shipped → Completed
- Reminder: actual payment via WeChat/Alipay external transfer

### 4.10 LGS (Local Game Store) Portal — V3.5

- Application: store name, business license, address, contact info
- Platform review (1-3 business days)
- Store verification badge upon approval

Store features:
- Store homepage: branding, intro, address, hours
- Product management: publish inventory, bulk operations
- Inventory system (linked to 4.6)
- Event publishing: FNM, weekly tournaments, presales
- Analytics dashboard: views, inquiries, transactions
- LBS: users can search nearby stores on map

---

## 5. Technical Architecture

### 5.1 Data Model (Key Entities)

| Entity | Key Fields |
|--------|-----------|
| Card | scryfall_id, name_cn, name_en, name_jp, mana_cost, colors, type_line, rarity, set_code, oracle_text, image_uris, legalities |
| Price | card_id, source (justtcg/scryfall/hareruya/...), market (US/JP/CN), price_normal, price_foil, condition, currency, source_type (direct/derived/community), fetched_at |
| PriceHistory | card_id, source, market, price, recorded_date |
| User | openid, nickname, avatar, credit_score, is_verified, is_shop, theme_preference, price_source_prefs |
| PriceList | user_id, list_name, items[{card_id, qty, condition, notes}], total_value |
| Deck | user_id, deck_name, format, mainboard[], sideboard[] |
| Collection | user_id, card_id, quantity, condition, printing_version |
| Post | user_id, post_type (discussion/selling/buying/trading/showcase), title, content, card_refs[], images[], status, likes, comments_count |
| Trade | buyer_id, seller_id, card_refs[], agreed_amount, status (pending/confirmed/shipped/completed/disputed), created_at |
| Message | sender_id, receiver_id, content, msg_type (text/image/voice/card/trade_confirm), trade_ref, created_at |
| Shop | user_id, shop_name, license_no, address, lat, lng, phone, hours, inventory[], verified_at |

### 5.2 Recommended Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | WeChat Mini Program (native) + Taro (optional) | Taro enables cross-platform later |
| Backend | Node.js (NestJS) or Python (FastAPI) | Lightweight, good AI/ML integration |
| Database | PostgreSQL + Redis | PG for business data; Redis for price cache, sessions, hot data |
| Search | Elasticsearch | Full-text card search + multi-facet filtering |
| AI/NLP | OpenAI API / Zhipu GLM / Tongyi Qianwen | Intent recognition + entity extraction for NL search |
| Object Storage | Tencent COS / Alibaba OSS | Card image CDN cache |
| Push Notifications | WeChat Subscribe Messages | Price alerts, trade notifications |
| IM | Tencent Cloud IM / Rongcloud | Private chat real-time messaging |
| Price Scheduler | Celery (Python) / Bull Queue (Node) | Scheduled jobs for price source fetching |
| Scraper | Scrapy / Playwright | For sources without API (Hareruya, etc.) |
| FX Rates | ExchangeRate-API or similar | Real-time currency conversion |
| Price Adapter | Custom abstraction layer | Unified interface over all price sources; enables hot-swap if any source fails |

### 5.3 Backend Architecture: Price Adapter Pattern

```
                    ┌──────────────┐
                    │  Price API   │ ← Frontend calls this
                    │  Controller  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Price     │ ← Unified interface
                    │   Service    │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
   │  JustTCG    │ │  Scryfall   │ │  Hareruya    │
   │  Adapter    │ │  Adapter    │ │  Adapter     │
   │ (REST API)  │ │ (REST API)  │ │ (Scraper)    │
   └─────────────┘ └─────────────┘ └──────────────┘
```

Each adapter implements a common interface:
```typescript
interface PriceAdapter {
  source: string;
  market: string;
  fetchPrice(cardId: string): Promise<PriceResult>;
  fetchBulkPrices(cardIds: string[]): Promise<PriceResult[]>;
  getHealthStatus(): Promise<boolean>;
}
```

If any adapter fails, the service degrades gracefully and falls back to the next available source.

---

## 6. Version Roadmap

| Version | Phase | Core Scope | Timeline |
|---------|-------|-----------|----------|
| **V1.0** | MVP — Price Tool | Card database (Scryfall), basic search (name + filters), price display (JustTCG + Scryfall fallback), price lists + export, price history chart | 6-8 weeks |
| **V1.5** | Smart Search + Multi-source | AI natural language search, voice input, Hareruya scraper, user-selectable price sources, price alerts, hot movers board | 4-6 weeks |
| **V2.0** | Community | Post system (5 types), user profiles + credit system, likes/comments/reposts, deck builder, CN market price aggregation | 8-10 weeks |
| **V2.5** | Collection | Personal collection manager, portfolio value tracking, collection-to-community linking | 4-6 weeks |
| **V3.0** | Trading | Private chat, trade confirmation flow, trade review system, dispute mechanism | 8-10 weeks |
| **V3.5** | Store Ecosystem | LGS onboarding + verification, store pages + inventory, LBS nearby store search, store analytics | 6-8 weeks |
| **V4.0** | UI Polish | Full fantasy UI upgrade, micro-interactions, achievement system, card scanner (exploratory) | Ongoing |

### Demo Scope (for Replit)

For the initial Replit demo, focus on:

1. **Card search & browsing** — connect to Scryfall API for card data
2. **Price display** — show Scryfall prices as placeholder; mock JustTCG data if API key not yet available
3. **Card detail page** — full layout with price panel, history chart placeholder
4. **Price list** — create list, add cards, see total, export as image
5. **Theme toggle** — Light/Dark theme switch in settings
6. **Basic community feed** — mock data for the 5 post types with correct icons/tags
7. **Tab bar navigation** — 4-tab structure as specified

Lower priority for demo: AI search, private chat, trade flow, store portal, real scraper integrations.

---

## 7. Appendix

### 7.1 Card Condition Standards

| Code | English | Chinese | Description |
|------|---------|---------|-------------|
| NM | Near Mint | 近完美 | Almost no wear |
| SP | Slightly Played | 轻微使用 | Minor edge wear or light scratches |
| MP | Moderately Played | 中度使用 | Noticeable wear, card info intact |
| HP | Heavily Played | 重度使用 | Heavy wear, creases, or water damage |
| D | Damaged | 损坏 | Severe damage affecting playability |

### 7.2 Key API References

| API | Purpose | Docs |
|-----|---------|------|
| Scryfall | Card metadata (name, image, rules, legalities) | https://scryfall.com/docs/api |
| JustTCG | US market prices (TCGPlayer ecosystem) | https://justtcg.com/docs |
| Scryfall Bulk Data | Full card database download | https://scryfall.com/docs/api/bulk-data |

### 7.3 Glossary

| Term | Definition |
|------|-----------|
| FNM | Friday Night Magic — weekly official play events |
| Meta | The prevailing dominant decks and strategies in a format |
| Foil | Special shiny printing of a card, usually more valuable |
| Commander/EDH | Most popular multiplayer casual format |
| Standard | Rotating format using the most recent sets |
| Modern | Non-rotating format using cards from 2003 onwards |
| Pioneer | Non-rotating format using cards from 2012 onwards |
| LGS | Local Game Store |
| Price Adapter | Backend abstraction layer that unifies different price source APIs into a common interface |
| JustTCG | Third-party TCG pricing API service providing TCGPlayer ecosystem price data |
| Matchmaking Model | Platform connects buyers and sellers but does not process payments |

---

*— End of Document —*
