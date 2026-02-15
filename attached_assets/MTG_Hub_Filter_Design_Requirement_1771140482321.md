# MTG Hub — Advanced Card Filter Design Requirement

> **Purpose:** Detailed specification for the Advanced Search / Filter panel on the Card Library page.  
> **Reference:** Modeled after MTGso's advanced search system, which is the most comprehensive Chinese MTG search tool.  
> **Priority:** This is the core search experience — must be implemented completely.

---

## 1. Filter Panel Overview

The Advanced Search panel is accessed from the Card Library tab. It should be presented as a full-page scrollable form with a sticky bottom bar containing [Clear All] and [Search] buttons.

### Layout Structure

```
┌──────────────────────────────────────┐
│  ← Back                             │
│                                      │
│  Advanced Search                     │
│  Set filters to find specific cards  │
│                                      │
│  ┌─ Card Name ─────────────────────┐ │
│  │ [Text input field]              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Rules Text ────────────────────┐ │
│  │ [Text input field]              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Type ──────────────────────────┐ │
│  │ [Include/Exclude toggle] [Input]│ │
│  │ [+ Add Type]                    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Set / Expansion ──────────────┐ │
│  │ [Input set code] [Select >]     │ │
│  │ [+ Add Set]                     │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Rarity ────────────────────────┐ │
│  │ ☐ Mythic  ☐ Rare               │ │
│  │ ☐ Uncommon  ☐ Common           │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Color ─────────────────────────┐ │
│  │ ☐W ☐U ☐B ☐R ☐G ☐Colorless     │ │
│  │ ☐ Must be multicolor            │ │
│  │ ☐ Exclude unselected colors     │ │
│  │ ☐ Partial match                 │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Mana Cost ────────────────────┐ │
│  │ [Mana symbol selector]         │ │
│  │ Converted Mana Cost:           │ │
│  │ [Operator ▼] [Number input]    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Power ─────────────────────────┐ │
│  │ [Operator ▼] [Number input]    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Toughness ─────────────────────┐ │
│  │ [Operator ▼] [Number input]    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Format Legality ──────────────┐ │
│  │ [Dropdown: select format]       │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Flavor Text ──────────────────┐ │
│  │ [Text input field]              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Artist ────────────────────────┐ │
│  │ [Text input field]              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Language ──────────────────────┐ │
│  │ [Dropdown / multi-select]       │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Sort By ───────────────────────┐ │
│  │ [Dropdown] [Asc/Desc toggle]    │ │
│  └─────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│  [Clear All]          [🔍 Search]   │ (sticky bottom bar)
└──────────────────────────────────────┘
```

---

## 2. Filter Fields — Complete Specification

### 2.1 Card Name (卡牌名称)

| Property | Value |
|----------|-------|
| Field type | Text input |
| Placeholder | "Enter card name" |
| Behavior | Fuzzy match by default; supports Chinese, English, and Japanese card names |
| Notes | Should trigger autocomplete suggestions after 2+ characters |

### 2.2 Rules Text (规则)

| Property | Value |
|----------|-------|
| Field type | Text input |
| Placeholder | "Enter rules text keywords" |
| Behavior | Searches within the oracle text of cards |
| Notes | Supports partial keyword match (e.g., "destroy target creature") |

### 2.3 Type (类别)

| Property | Value |
|----------|-------|
| Field type | Text input + Include/Exclude toggle + "Add Type" button |
| Include/Exclude | Toggle switch — when ON = "includes this type"; when OFF = "excludes this type" |
| Placeholder | "Enter type" |
| Options | Should support autocomplete for all MTG types |
| Multi-entry | User can add multiple type filters; each entry has its own include/exclude toggle |
| "Add Type" button | Adds another type filter row |

**Common types for autocomplete:**
- Supertypes: Legendary, Basic, Snow, World
- Card types: Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, Kindred
- Subtypes (Creature): Human, Elf, Goblin, Dragon, Angel, Zombie, Merfolk, Warrior, Wizard, Soldier, etc.
- Subtypes (Land): Plains, Island, Swamp, Mountain, Forest
- Subtypes (Other): Aura, Equipment, Vehicle, Saga, Adventure, Food, Treasure, Clue

### 2.4 Set / Expansion (系列)

| Property | Value |
|----------|-------|
| Field type | Text input (for set code) + "Select" picker button + "Add Set" button |
| Placeholder | "Enter set code abbreviation" |
| Select picker | Opens a full-screen set browser/selector with set names, icons, and codes |
| Multi-entry | User can add multiple sets to search across |
| "Add Set" button | Adds another set filter row |

### 2.5 Rarity (稀有度)

| Property | Value |
|----------|-------|
| Field type | Checkbox group (multi-select) |
| Options | 4 checkboxes in a single row |

| Option | English | Chinese | Scryfall value |
|--------|---------|---------|----------------|
| ☐ | Mythic Rare | 秘稀 | `mythic` |
| ☐ | Rare | 稀有 | `rare` |
| ☐ | Uncommon | 非普通 | `uncommon` |
| ☐ | Common | 普通 | `common` |

Behavior: If none selected, rarity is not filtered. Multiple selections = OR logic.

### 2.6 Color (颜色)

| Property | Value |
|----------|-------|
| Field type | Checkbox group + modifier options |

**Row 1 — Color checkboxes (with mana symbol icons):**

| Option | Symbol | Chinese | Scryfall value |
|--------|--------|---------|----------------|
| ☐ | {W} | 白 (White) | `w` |
| ☐ | {U} | 蓝 (Blue) | `u` |
| ☐ | {B} | 黑 (Black) | `b` |
| ☐ | {R} | 红 (Red) | `r` |
| ☐ | {G} | 绿 (Green) | `g` |
| ☐ | {C} | 无 (Colorless) | `c` |

**Row 2 — Color match modifiers:**

| Option | Chinese | Behavior |
|--------|---------|----------|
| ☐ Must be multicolor | 必须多色 | Only return cards that are 2+ colors |
| ☐ Exclude unselected | 不含未选 | Strict match — card must ONLY contain selected colors, no others |
| ☐ Partial match | 部分匹配 | Card contains at least one of the selected colors |

**"Show Help" link** next to the Color section header — taps to show a tooltip/modal explaining the three modifier options.

### 2.7 Mana Cost (法术力费用)

| Property | Value |
|----------|-------|
| Field type | Mana symbol selector + CMC numeric filter |

**Mana symbol selector:**
- Interactive mana symbol input allowing users to specify an exact mana cost pattern
- Tappable mana symbols: {W}, {U}, {B}, {R}, {G}, {C}, {X}, {0}-{20}, hybrid symbols
- Displays the selected mana cost visually using mana icons

**Converted Mana Cost (CMC / Mana Value):**

| Component | Type | Options |
|-----------|------|---------|
| Operator | Dropdown | `=`, `≤`, `≥`, `<`, `>`, `≠` |
| Value | Number input | 0–20+ |

### 2.8 Power (力量)

| Property | Value |
|----------|-------|
| Field type | Operator dropdown + number input |
| Operator options | `=`, `≤`, `≥`, `<`, `>`, `≠` |
| Value | Number input (supports `*` for variable power) |
| Notes | Only applicable to creatures; should be grayed out / hidden if "Creature" type is not selected |

### 2.9 Toughness (防御力)

| Property | Value |
|----------|-------|
| Field type | Operator dropdown + number input |
| Operator options | `=`, `≤`, `≥`, `<`, `>`, `≠` |
| Value | Number input (supports `*` for variable toughness) |
| Notes | Same as Power — creature-only stat |

### 2.10 Format Legality (赛制)

| Property | Value |
|----------|-------|
| Field type | Dropdown selector (single-select) |
| Options | See table below |

| Format | Chinese | Scryfall value |
|--------|---------|----------------|
| Standard | 标准 | `standard` |
| Pioneer | 先驱 | `pioneer` |
| Modern | 近代 | `modern` |
| Legacy | 薪传 | `legacy` |
| Vintage | 特选 | `vintage` |
| Commander / EDH | 指挥官 | `commander` |
| Pauper | 纯普 | `pauper` |
| Historic | 史迹 | `historic` |
| Alchemy | 炼金术 | `alchemy` |
| Explorer | 探险家 | `explorer` |
| Brawl | 争锋 | `brawl` |
| Oathbreaker | 破誓 | `oathbreaker` |
| Timeless | 永恒 | `timeless` |
| (No filter) | 不限赛制 | — |

Behavior: When a format is selected, only cards legal in that format are returned.

### 2.11 Flavor Text (背景叙述)

| Property | Value |
|----------|-------|
| Field type | Text input |
| Placeholder | "Enter flavor text keywords" |
| Behavior | Searches within flavor text field |

### 2.12 Artist (画师)

| Property | Value |
|----------|-------|
| Field type | Text input with autocomplete |
| Placeholder | "Enter artist name" |
| Behavior | Matches artist name; autocomplete from known artist list |

### 2.13 Language (语言)

| Property | Value |
|----------|-------|
| Field type | Dropdown or multi-select chips |
| Options | Chinese Simplified (简体中文), Chinese Traditional (繁体中文), English, Japanese, Korean, German, French, Italian, Spanish, Portuguese, Russian |
| Default | No filter (all languages) |

### 2.14 Sort By (排序)

| Property | Value |
|----------|-------|
| Field type | Dropdown + ascending/descending toggle |

| Sort option | Chinese |
|-------------|---------|
| Name | 名称 |
| Mana Value / CMC | 法术力费用 |
| Price (USD) | 价格 (美元) |
| Price (JPY) | 价格 (日元) |
| Price (CNY) | 价格 (人民币) |
| Rarity | 稀有度 |
| Power | 力量 |
| Toughness | 防御力 |
| Set release date | 系列发售日期 |
| Collector number | 收藏编号 |

---

## 3. Interaction Behaviors

### 3.1 Bottom Action Bar (Sticky)

| Button | Position | Style | Action |
|--------|----------|-------|--------|
| Clear All (清空) | Left | Text button, accent color | Resets ALL filter fields to empty/default |
| Search (搜索) | Right | Primary filled button, full-width right portion | Executes search with current filters, navigates to results page |

### 3.2 Filter State Indicators

- When a filter section has active values, show a small blue dot or badge on the section header
- Show a summary chip bar at the top of search results (e.g., `Color: Blue × | Format: Modern × | Rarity: Rare ×`) with tap-to-remove functionality

### 3.3 Saved Filters (Nice-to-have)

- Allow users to save frequently used filter combinations as presets
- Quick access from the filter page header

### 3.4 Quick Filter Chips (on Card Library main page)

Before opening the full Advanced Search, show quick-filter chips on the Card Library page:

```
[Standard] [Modern] [Commander] [White] [Blue] [Black] [Red] [Green] [Creature] [Instant] [Rare+]
```

Tapping a chip applies that single filter immediately. Tapping "Advanced Search" opens the full filter panel.

---

## 4. Mapping to Scryfall API

For developer reference, here's how each filter maps to Scryfall's search syntax:

| Filter | Scryfall Syntax Example |
|--------|------------------------|
| Card name | `"Black Lotus"` or `!"exact name"` |
| Rules text | `o:"destroy target creature"` |
| Type (include) | `t:creature` or `t:instant` |
| Type (exclude) | `-t:creature` |
| Set | `s:mh3` or `e:mh3` |
| Rarity | `r:mythic` or `r:rare` |
| Color (exact) | `c=wu` (exactly white-blue) |
| Color (include) | `c>=wu` (at least white and blue) |
| Color (partial) | `c:w` or `c:u` (contains white OR blue) |
| Colorless | `c=c` or `c:c` |
| Multicolor only | `c>=2` |
| Exclude unselected | `c=wr` (exactly white-red, no other colors) |
| CMC | `cmc=3` or `cmc>=5` |
| Mana cost | `mana:{2}{W}{U}` |
| Power | `pow>=4` or `pow=*` |
| Toughness | `tou<=2` |
| Format | `f:modern` or `f:commander` |
| Flavor text | `ft:"some text"` |
| Artist | `a:"John Avon"` |
| Language | `lang:jp` or `lang:zhs` |
| Sort | `order:cmc` + `dir:asc` |

---

## 5. Implementation Notes for Replit

### Priority for Demo

1. **Must have:** Card Name, Type, Set, Rarity, Color (with modifiers), CMC, Format Legality, Sort By
2. **Should have:** Rules Text, Power, Toughness, Mana Cost selector
3. **Nice to have:** Flavor Text, Artist, Language, Saved Filters

### Technical Notes

- Use Scryfall API `/cards/search` endpoint with the `q` parameter constructed from filter selections
- Autocomplete for card names: use Scryfall `/cards/autocomplete` endpoint
- Set list: fetch from Scryfall `/sets` endpoint and cache locally
- Type list: can be hardcoded for common types, or use Scryfall `/catalog/card-types`, `/catalog/creature-types`, etc.
- All filter state should be managed in a single state object for easy serialization (for saved filters and URL sharing)

### Example API Call

```
GET https://api.scryfall.com/cards/search?q=c%3Dub+t%3Ainstant+r%3Arare+f%3Amodern+cmc%3C%3D3&order=cmc&dir=asc
```

This searches for: Blue-Black Instant, Rare, Modern-legal, CMC ≤ 3, sorted by mana value ascending.

---

*— End of Filter Specification —*
