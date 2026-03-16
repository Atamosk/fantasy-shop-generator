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

### Build-time processing (`web/scripts/build-data.js`)

Runs as a prebuild step (`npm run build:data` before `vite build`). Processes raw data sources into optimized JSON for the frontend.

**Inputs:**
- `src/data/items.json` — local item dataset (weapons, armor, potions, gear)
- `dnd-data` NPM package — spells collection

**Processing:**
- **Items:** Normalize fields (weight as numbers, consistent rarity casing), categorize by type (weapons, armor, potions, adventuring gear, etc.)
- **Spells:** Deduplicate using book priority ordering (later books override earlier), preserve source book attribution
- **Scrolls:** Merge spell data with scroll pricing/rarity by spell level

**Outputs** (written to `web/src/data/` or `web/public/data/`):
- `items.json` — normalized, categorized items
- `spells.json` — deduplicated spell list
- `scrolls.json` — spell scrolls with pricing, rarity, and spell details

**Output schema — common fields:**
- `name`, `type` (category), `price`, `rarity`, `weight`

**Category-specific fields:**
- Weapons: `damage`, `properties`
- Armor: `AC`, `stealthDisadvantage`
- Scrolls: `spellLevel`, `spellSchool`, `spellName`, `sourceBook`, `description`

### Why build-time?

The data is static. Processing at build time means zero load-time cost, smaller bundles (only ship what's needed), and data is validated before it reaches users.

## Shop Generation System

### Shop Templates

Predefined shop types, each defining:
- Name and flavor text (e.g., "Blacksmith — Weapons, armor, and shields")
- Item category pools (which categories to draw from)
- Rarity distribution (e.g., village blacksmith skews Common/Uncommon)
- Price range defaults
- Inventory size range (min/max items)

**Starting templates:**
- **Blacksmith** — weapons, armor, shields
- **Alchemist** — potions, poisons, alchemical supplies
- **General Store** — adventuring gear, mundane equipment
- **Arcane Shop** — spell scrolls, wands, magical curiosities
- **Armorer** — armor, shields (deeper inventory than blacksmith)
- **Wandering Merchant** — mixed bag, random categories

### Tuning Parameters

After picking a template, the DM can optionally adjust:
- **Party level** — shifts rarity distribution (higher level = rarer items more likely)
- **Town size** — affects inventory size and price ranges (hamlet vs. metropolis)
- **Budget cap** — maximum price per item in gold

### Generation Algorithm

1. Start with the template's category pools and rarity distribution
2. Apply parameter adjustments (party level shifts rarity weights, town size scales inventory count)
3. For each inventory slot: weighted random pick from eligible items
4. De-duplicate (no two of the same item)
5. Sort by category, then by price

### Re-roll

Users can re-roll the entire shop (new seed) or re-roll a single item slot (replaces with another random pick from the same pool).

### Deterministic Generation

The algorithm uses a seeded PRNG (e.g., `seedrandom` library). Given the same template, parameters, and seed, the output is always identical. This enables shareable URLs.

## Item Browser / Catalog

### Layout

- **Search bar** at top — filters by name, instant
- **Filter panel** with:
  - Category (weapons, armor, potions, scrolls, etc.) — multi-select
  - Rarity (Common through Legendary) — multi-select
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
/shop?template=blacksmith&level=5&town=large&seed=a7f3b2
```

The deterministic generation algorithm reproduces the same shop from the same seed, so links are stable and short.

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
- **Rarity colors:** consistent color coding (Common=gray, Uncommon=green, Rare=blue, Very Rare=purple, Legendary=orange/gold)

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
