# Fantasy Shop Generator — Webapp Design

## Overview

A public-facing static web application that generates fantasy shop inventories for D&D-compatible tabletop RPGs and provides a searchable item catalog. Built as a React SPA with Vite, bundling all data at build time — no backend required.

## Goals

- DMs can quickly generate thematic shop inventories using templates and optional tuning parameters
- Users can browse, search, and filter the full item/spell/scroll catalog
- Shops and filtered views are shareable via URL
- Polished, responsive UI with a modern-fantasy aesthetic (dark theme, amber/gold accents)

## Architecture

### Approach: Monorepo with `web/` directory

The webapp lives in `web/` alongside the existing exploratory Node.js code. The existing `src/` files (`spells.js`, `scrolls.js`, `mitch.js`, `app.js`) remain as-is — they are exploratory scripts, not shared infrastructure. The webapp has its own clean implementation.

### Static SPA — No Backend

All data is processed at build time and bundled into the frontend. Shareable state is encoded in URLs. Hosting is static (GitHub Pages, Vercel, or Netlify).

## Data Pipeline

### Data Sources

Two independent data sources, each serving a different purpose:

- **`src/data/items.json`** (1,782 items) — the primary item source. Contains price, rarity, weight, type, and base_item. This is the only source with pricing data. Sourced from web scraping. Fields: `type` ("Combat", "Utility", "Consumable", "Destroyable"), `name`, `price` (number), `base_item` (string or null), `rarity` ("Mundane", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"), `weight` (string — may be a number like "20", or "-" for unspecified).
- **`dnd-data` NPM package** — spell data only (5,849 spells). Used to build the spell/scroll catalog. Item data in `dnd-data` is not used (it has 15,749 items but no pricing, messy type labels with 500+ variations, and overlaps with `items.json`).

Note: The existing project uses `alasql` for querying. The webapp does not — all filtering and querying is plain JS (Array.filter/sort/map), which is simpler and avoids shipping a SQL engine to the browser.

### Build-time processing (`web/scripts/build-data.js`)

Runs as a prebuild step (`npm run build:data` before `vite build`).

**Item processing:**
- Read `src/data/items.json`
- Normalize weight: parse numeric strings to numbers, convert `"-"` to `null`
- Normalize rarity casing to title case
- Map `"Mundane"` rarity to `"Common"` (Mundane items are non-magical common goods — functionally equivalent to Common for filtering and shop generation)
- Preserve `requirements` field (contains attunement/class requirements, e.g., "Spellcaster", "Paladin") — useful for display. HTML entities (e.g., `&#39;`) are decoded to plain text.
- Preserve source `type` field as `sourceType` ("Combat", "Utility", "Consumable", "Destroyable") — useful for secondary filtering (e.g., distinguishing consumable ammunition from permanent gear)
- Drop `link` field (D&D Beyond URLs — not needed in the webapp, avoids external link dependencies)
- Assign a `category` field based on `base_item` and `name` heuristics (see Category Mapping below)
- Output: `items.json`

**Spell processing:**
- Read `dnd-data` spells
- Deduplicate using book priority ordering (later books override earlier), using the same logic as the existing `spells.js`
- Preserve source book attribution
- Output: `spells.json`

**Scroll processing:**
- Take deduplicated spells, merge with scroll pricing/rarity by spell level (same pricing table as existing `scrolls.js`)
- Output: `scrolls.json`

**Outputs** (written to `web/src/data/generated/`, gitignored as build artifacts):
- `items.json` — normalized, categorized items
- `spells.json` — deduplicated spell list
- `scrolls.json` — spell scrolls with pricing, rarity, and spell details

### Output Schemas

**Items:**
- `name` (string), `category` (string — see below), `price` (number, gold pieces), `rarity` (string), `weight` (number or null), `base_item` (string or null), `sourceType` (string — original type from source data), `requirements` (string or null — attunement/class requirements)

**Scrolls:**
- `name` (string, e.g., "Spell Scroll: Fireball"), `category` ("Scroll"), `price` (number), `rarity` (string), `spellLevel` (number), `spellSchool` (string), `spellName` (string), `sourceBook` (string)

**Spells** (for the browse catalog, not for shop generation):
- `name` (string), `level` (number), `school` (string), `sourceBook` (string)

### Bundle Size Strategy

Spell descriptions from `dnd-data` total ~4.4MB raw text (before deduplication). Including full descriptions in the main bundle would significantly impact load time. Strategy:

- **Main bundles** (`items.json`, `scrolls.json`, `spells.json`): contain metadata only (name, level, school, price, rarity, etc.) — no descriptions. These are small and load instantly.
- **Descriptions**: loaded on demand. When a user expands an item/spell detail view, the description is loaded from a separate `descriptions.json` file (keyed by name). This file is code-split and only fetched when needed.
- If `descriptions.json` is still too large after deduplication, split further by category or spell level.

### Category Mapping

Items from `items.json` are assigned a `category` based on `base_item` keyword matching. The build script maps base_item values to categories:

| Category | base_item matches (contains, case-insensitive) |
|----------|------------------------------------------------|
| Weapon | Sword, Axe, Dagger, Bow, Mace, Hammer, Spear, Crossbow, Glaive, Halberd, Pike, Staff, Whip, Flail, Morningstar, Trident, Lance, Maul, Rapier, Scimitar, Javelin, Club, Dart, Sling, Blowgun, Boomerang |
| Armor | Breastplate, Chain Mail, Chain Shirt, Half Plate, Plate, Ring Mail, Scale Mail, Splint, Studded Leather, Leather, Padded, Hide |
| Shield | Shield |
| Potion | Potion, Substance |
| Ammunition | Arrow, Bolt, Bullet, Needle |
| Wand | Wand |
| Ring | Ring |
| Scroll | Scroll |
| Wondrous Item | (items with rarity Uncommon+ that don't match other categories) |
| Adventuring Gear | (everything else) |

Items without a `base_item` are categorized by `name` keyword matching using the same rules, falling back to "Adventuring Gear."

Note: The source `type` field ("Combat", "Utility", "Consumable", "Destroyable") is preserved as `sourceType` but is NOT used for category assignment. Most Consumable/Destroyable items are ammunition variants that get correctly categorized via their `base_item` (Arrow, Bolt, etc.). The `sourceType` is available for optional secondary filtering in the UI.

This mapping is defined as a data table in the build script, not hardcoded logic, so it's easy to adjust as we review the output.

### Why build-time?

The data is static. Processing at build time means zero load-time cost, smaller bundles (only ship what's needed), and data is validated before it reaches users.

## Shop Generation System

### Shop Templates

Predefined shop types, each defining:
- Name and flavor text
- Item category pools (which categories to draw from)
- Base rarity weights (probability distribution across rarities)
- Base inventory size (number of items)

**Starting templates:**

| Template | Categories | Base Rarity Weights | Base Size |
|----------|-----------|---------------------|-----------|
| Blacksmith | Weapon, Armor, Shield | Common 50%, Uncommon 35%, Rare 10%, Very Rare 5% | 15 |
| Alchemist | Potion | Common 40%, Uncommon 35%, Rare 20%, Very Rare 5% | 12 |
| General Store | Adventuring Gear, Ammunition | Common 70%, Uncommon 25%, Rare 5% | 20 |
| Arcane Shop | Scroll, Wand, Ring, Wondrous Item | Common 30%, Uncommon 35%, Rare 25%, Very Rare 8%, Legendary 2% | 10 |
| Armorer | Armor, Shield | Common 45%, Uncommon 35%, Rare 15%, Very Rare 5% | 12 |
| Wandering Merchant | (all categories) | Common 50%, Uncommon 30%, Rare 15%, Very Rare 5% | 8 |

### Tuning Parameters

After picking a template, the DM can optionally adjust:

**Party level** (1-20, default 5) — shifts rarity weights. For every 4 levels above 5, shift 10% weight from Common toward rarer tiers (distributed proportionally among Uncommon/Rare/Very Rare/Legendary). For levels below 5, shift weight from rarer tiers toward Common. This ensures low-level parties see mostly common items and high-level parties see more magical gear.

Example: Blacksmith template (base: Common 50%, Uncommon 35%, Rare 10%, Very Rare 5%) at party level 13 → 2 steps above baseline → shift 20% from Common. Result: Common 30%, Uncommon 42%, Rare 18%, Very Rare 10%.

**Town size** — scales inventory count:

| Town Size | Inventory Multiplier | Description |
|-----------|---------------------|-------------|
| Hamlet | 0.5x | Tiny settlement, very limited stock |
| Village | 0.75x | Small community |
| Town | 1.0x (default) | Standard market |
| City | 1.5x | Large settlement, broad selection |
| Metropolis | 2.0x | Major hub, extensive inventory |

**Budget cap** (optional, in gold) — filters out any item above this price before generation. No default.

### Generation Algorithm

1. Start with the template's category pools and base rarity weights
2. Adjust rarity weights based on party level
3. Calculate inventory size: template base size * town size multiplier (rounded, minimum 3)
4. Build the eligible item pool: all items matching the template's categories, filtered by budget cap if set
5. For each inventory slot:
   a. Roll a rarity tier using the adjusted weights
   b. Pick a random item from the eligible pool matching that rarity
   c. If no items exist at that rarity, fall back to the nearest available rarity
6. De-duplicate (no two of the same item; if a duplicate is rolled, re-roll up to 3 times, then skip the slot)
7. Sort by category, then by price

### Re-roll

Users can re-roll the entire shop (new seed) or re-roll a single item slot (replaces with another random pick from the same pool).

### Deterministic Generation

The algorithm uses a seeded PRNG (e.g., `seedrandom` library). Given the same template, parameters, and seed, the output is always identical. This enables shareable URLs.

## Item Browser / Catalog

### Layout

- **Search bar** at top — filters by name, instant
- **Filter panel** with:
  - Category (weapons, armor, potions, scrolls, etc.) — multi-select
  - Rarity (Common, Uncommon, Rare, Very Rare, Legendary, Artifact) — multi-select
  - Price range — min/max inputs or slider
  - For scrolls: spell level, spell school
- **Results table:** name, category, price, rarity, weight
- **Item detail:** click a row to expand — description, properties, source book (for scrolls)
- **Sorting:** clickable column headers — sort by name, price, rarity, weight

## URL State & Shareable Links

### Item Browser

Filter state in query params:
```
/browse?category=weapon,armor&rarity=rare&maxPrice=500&q=sword
```

### Generated Shops

Seed-based encoding — template, parameters, and random seed in the URL:
```
/shop?template=blacksmith&level=5&town=city&seed=a7f3b2
```

The deterministic generation algorithm reproduces the same shop from the same seed, so links are stable and short.

### Invalid URL Parameters

Invalid or unrecognized URL parameter values silently fall back to defaults (e.g., `?rarity=SuperRare` is ignored, `?level=abc` falls back to default level). No error messages — the UI just shows the default state.

### Routes

- `/` — Landing page with entry points to "Generate a Shop" and "Browse Items"
- `/shop` — Shop generator (template picker → parameters → inventory)
- `/browse` — Item catalog (search + filter + table)

## Project Structure

```
web/
  scripts/
    build-data.js          # data pipeline (prebuild step)
  src/
    main.jsx               # React entry point
    App.jsx                 # Router setup
    pages/
      Home.jsx
      ShopGenerator.jsx
      ItemBrowser.jsx
    components/
      ShopTemplateCard.jsx  # template selection card
      ShopInventory.jsx     # generated inventory display
      ItemTable.jsx         # reusable sortable/filterable table
      ItemDetail.jsx        # expanded item view
      FilterPanel.jsx       # shared filter controls
      RarityBadge.jsx       # rarity color indicator
    data/
      templates.js          # shop template definitions
      generation.js         # shop generation algorithm (deterministic w/ seed)
    hooks/
      useUrlState.js        # sync state <-> URL params
    styles/
      theme.css             # dark theme, amber/gold accents
    assets/                 # icons, static assets
  public/
  index.html
  vite.config.js
  package.json
```

## Tech Stack

- **React** + **React Router** — UI framework and client-side routing
- **Vite** (`@vitejs/plugin-react`) — build tooling, dev server, optimized static output
- **seedrandom** — deterministic PRNG for reproducible shop generation
- **No component library** — custom styled components to match the fantasy-modern aesthetic
- **No CSS framework** — plain CSS with custom properties for theming

## Visual Design

Modern layout and usability with fantasy accent elements:
- **Dark background** (warm dark browns/grays, not pure black)
- **Amber/gold accent color** for highlights, prices, interactive elements
- **Clean sans-serif typography** for readability
- **Fantasy touches:** warm color palette, thematic category icons, subtle border accents (e.g., gold left-border on alternating rows)
- **Rarity colors:** consistent color coding (Common=gray, Uncommon=green, Rare=blue, Very Rare=purple, Legendary=orange/gold, Artifact=red)

## Responsive Design

Two breakpoints:
- **Desktop (>768px):** Filter sidebar visible alongside results. Template cards in grid layout.
- **Mobile (<768px):** Filters collapse into toggleable drawer. Table adapts — less critical columns hide, rows become tappable cards. Templates stack vertically.

CSS approach: plain CSS with custom properties (CSS variables) and media queries. No CSS framework.

## Dependencies

**Runtime:**
- `react`, `react-dom` — UI
- `react-router-dom` — routing
- `seedrandom` — deterministic random generation

**Build-time:**
- `vite`, `@vitejs/plugin-react` — build tooling
- `dnd-data` — spell data source (consumed by build script, not shipped to browser)

## Out of Scope

- User accounts / authentication
- Server-side rendering
- Editable inventories (items are re-rollable, not hand-editable)
- Custom item creation
- Print-friendly styles (potential future addition)
