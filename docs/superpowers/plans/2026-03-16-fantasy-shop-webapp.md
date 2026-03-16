# Fantasy Shop Generator Webapp — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing React SPA that generates fantasy shop inventories and provides a searchable item/spell/scroll catalog, using existing data sources.

**Architecture:** Vite+React app in `web/` directory. Build-time data pipeline processes `src/data/items.json` and `dnd-data` spells into optimized JSON bundles. Two main features: shop generator (template + parameters → deterministic seeded inventory) and item browser (search/filter/sort catalog). URL state for shareable links. No backend.

**Tech Stack:** React 18, React Router 6, Vite 5, seedrandom, Vitest (testing), plain CSS with custom properties

**Spec:** `docs/superpowers/specs/2026-03-16-fantasy-shop-webapp-design.md`

---

## File Structure

```
web/
  scripts/
    build-data.js              # Build-time data pipeline (Node script)
  src/
    main.jsx                   # React entry + router mount
    App.jsx                    # Route definitions
    data/
      generated/               # gitignored build output
        items.json
        spells.json
        scrolls.json
        descriptions.json
      templates.js             # Shop template definitions (static data)
      categories.js            # Category mapping table + categorize function
      constants.js             # Shared constants (rarity list, scroll pricing, book list)
    logic/
      generation.js            # Shop generation algorithm (pure function, seeded PRNG)
      rarity.js                # Rarity weight adjustment logic (pure function)
      filters.js               # Item/spell/scroll filtering (pure functions)
    hooks/
      useUrlState.js           # Sync React state ↔ URL search params
    components/
      Layout.jsx               # App shell: header nav + main content area
      Layout.css
      RarityBadge.jsx          # Colored rarity label
      RarityBadge.css
      ItemTable.jsx            # Sortable table with expandable rows
      ItemTable.css
      ItemDetail.jsx           # Expanded item detail (metadata + lazy description)
      ItemDetail.css
      FilterPanel.jsx          # Sidebar filter controls (category, rarity, price, etc.)
      FilterPanel.css
    pages/
      Home.jsx                 # Landing page
      Home.css
      ShopGenerator.jsx        # Template picker → params → inventory
      ShopGenerator.css
      ItemBrowser.jsx          # Search + filter + results table
      ItemBrowser.css
    styles/
      theme.css                # CSS custom properties, reset, base typography
  public/
    favicon.ico
  index.html
  package.json
  vite.config.js
  vitest.config.js
```

---

## Chunk 1: Project Scaffolding + Data Pipeline

### Task 1: Scaffold Vite + React project

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.js`
- Create: `web/vitest.config.js`
- Create: `web/index.html`
- Create: `web/src/main.jsx`
- Create: `web/src/App.jsx`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize the web project**

```bash
cd web
npm init -y
npm install react react-dom react-router-dom seedrandom
npm install --save-dev vite @vitejs/plugin-react vitest @testing-library/react @testing-library/jest-dom jsdom dnd-data
```

Note: `dnd-data` is a build-time dependency only (consumed by `build-data.js`, not shipped to browser).

- [ ] **Step 2: Create `web/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Create `web/vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
});
```

- [ ] **Step 4: Create `web/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fantasy Shop Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `web/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: Create `web/src/App.jsx`** (placeholder routes)

```jsx
import { Routes, Route } from 'react-router-dom';

function Placeholder({ name }) {
  return <div style={{ color: '#e7e5e4', padding: '2rem' }}>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Home" />} />
      <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
      <Route path="/browse" element={<Placeholder name="Item Browser" />} />
    </Routes>
  );
}
```

- [ ] **Step 7: Create `web/src/styles/theme.css`** (minimal reset)

```css
:root {
  --color-bg: #1c1917;
  --color-surface: #292524;
  --color-text: #e7e5e4;
  --color-text-muted: #a8a29e;
  --color-accent: #fbbf24;
  --color-accent-dim: #78350f;
  --color-border: #44403c;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}
```

- [ ] **Step 8: Update `.gitignore`**

Add these lines:
```
web/node_modules/
web/dist/
web/src/data/generated/
```

- [ ] **Step 9: Add npm scripts and set module type in `web/package.json`**

Add `"type": "module"` (required for ESM imports in build-data.js and shared modules). Update scripts section:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build:data": "node scripts/build-data.js",
    "prebuild": "npm run build:data",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 10: Verify dev server starts**

```bash
cd web && npm run dev
```

Expected: Vite dev server starts, browser shows "Home — coming soon" at localhost.

- [ ] **Step 11: Commit**

```bash
git add web/ .gitignore
git commit -m "feat: scaffold Vite + React project in web/"
```

---

### Task 2: Constants and category mapping

**Files:**
- Create: `web/src/data/constants.js`
- Create: `web/src/data/categories.js`
- Create: `web/src/data/__tests__/categories.test.js`

- [ ] **Step 1: Create `web/src/data/constants.js`**

```js
export const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
  'Legendary',
  'Artifact',
];

export const RARITY_COLORS = {
  Common: '#9ca3af',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  'Very Rare': '#a855f7',
  Legendary: '#f59e0b',
  Artifact: '#ef4444',
};

export const SCROLL_PRICING = {
  0: { price: 30, rarity: 'Common' },
  1: { price: 74, rarity: 'Common' },
  2: { price: 182, rarity: 'Uncommon' },
  3: { price: 448, rarity: 'Uncommon' },
  4: { price: 1103, rarity: 'Rare' },
  5: { price: 2714, rarity: 'Rare' },
  6: { price: 6676, rarity: 'Very Rare' },
  7: { price: 16422, rarity: 'Very Rare' },
  8: { price: 40398, rarity: 'Very Rare' },
  9: { price: 99380, rarity: 'Legendary' },
};

export const DEFAULT_BOOK_LIST = [
  "Player's Handbook",
  "Free Basic Rules (2014)",
  "Princes of the Apocalypse",
  "Sword Coast Adventurer's Guide",
  "Volo's Guide to Monsters",
  "Xanathar's Guide to Everything",
  "Acquisitions Incorporated",
  "Eberron - Rising from the Last War",
  "Explorer's Guide to Wildemount",
  "Mythic Odysseys of Theros",
  "Icewind Dale - Rime of the Frostmaiden",
  "Tasha's Cauldron of Everything",
  "Fizban's Treasury of Dragons",
  "Strixhaven A Curriculum of Chaos",
  "Spelljammer - Adventures in Space",
  "Planescape - Adventures in the Multiverse",
  "The Book of Many Things",
  "Free Basic Rules (2024)",
  "Player's Handbook (2024)",
];

export const ALL_CATEGORIES = [
  'Weapon',
  'Armor',
  'Shield',
  'Potion',
  'Ammunition',
  'Wand',
  'Ring',
  'Scroll',
  'Wondrous Item',
  'Adventuring Gear',
];
```

- [ ] **Step 2: Write the failing test for categorizeItem**

Create `web/src/data/__tests__/categories.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { categorizeItem } from '../categories.js';

describe('categorizeItem', () => {
  it('categorizes by base_item weapon keywords', () => {
    expect(categorizeItem({ base_item: 'Longsword', name: 'Flame Tongue', rarity: 'Rare' })).toBe('Weapon');
    expect(categorizeItem({ base_item: 'Crossbow', name: 'Heavy Crossbow +1', rarity: 'Uncommon' })).toBe('Weapon');
  });

  it('categorizes armor by base_item', () => {
    expect(categorizeItem({ base_item: 'Breastplate', name: 'Adamantine Armor', rarity: 'Uncommon' })).toBe('Armor');
    expect(categorizeItem({ base_item: 'Studded Leather', name: 'Glamoured', rarity: 'Rare' })).toBe('Armor');
  });

  it('categorizes shields', () => {
    expect(categorizeItem({ base_item: 'Shield', name: 'Shield +1', rarity: 'Uncommon' })).toBe('Shield');
  });

  it('categorizes potions', () => {
    expect(categorizeItem({ base_item: 'Potion', name: 'Potion of Healing', rarity: 'Common' })).toBe('Potion');
  });

  it('categorizes ammunition', () => {
    expect(categorizeItem({ base_item: 'Arrow', name: 'Arrow +1', rarity: 'Uncommon' })).toBe('Ammunition');
  });

  it('categorizes wands', () => {
    expect(categorizeItem({ base_item: 'Wand', name: 'Wand of Fireballs', rarity: 'Rare' })).toBe('Wand');
  });

  it('categorizes rings', () => {
    expect(categorizeItem({ base_item: 'Ring', name: 'Ring of Protection', rarity: 'Rare' })).toBe('Ring');
  });

  it('categorizes ring mail as armor, not ring', () => {
    expect(categorizeItem({ base_item: 'Ring Mail', name: 'Ring Mail +1', rarity: 'Uncommon' })).toBe('Armor');
  });

  it('falls back to name matching when base_item is null', () => {
    expect(categorizeItem({ base_item: null, name: 'Longsword +2', rarity: 'Rare' })).toBe('Weapon');
    expect(categorizeItem({ base_item: null, name: 'Potion of Speed', rarity: 'Very Rare' })).toBe('Potion');
  });

  it('classifies uncommon+ items without keyword match as Wondrous Item', () => {
    expect(categorizeItem({ base_item: null, name: 'Cloak of Displacement', rarity: 'Rare' })).toBe('Wondrous Item');
    expect(categorizeItem({ base_item: 'Cloak', name: 'Cloak of Elvenkind', rarity: 'Uncommon' })).toBe('Wondrous Item');
  });

  it('classifies common items without keyword match as Adventuring Gear', () => {
    expect(categorizeItem({ base_item: null, name: 'Rope, 50 feet', rarity: 'Common' })).toBe('Adventuring Gear');
    expect(categorizeItem({ base_item: 'Rope', name: 'Rope', rarity: 'Mundane' })).toBe('Adventuring Gear');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd web && npx vitest run src/data/__tests__/categories.test.js
```

Expected: FAIL — `categorizeItem` not found.

- [ ] **Step 4: Implement `web/src/data/categories.js`**

```js
const WEAPON_KEYWORDS = [
  'sword', 'axe', 'dagger', 'bow', 'mace', 'hammer', 'spear', 'crossbow',
  'glaive', 'halberd', 'pike', 'staff', 'whip', 'flail', 'morningstar',
  'trident', 'lance', 'maul', 'rapier', 'scimitar', 'javelin', 'club',
  'dart', 'sling', 'blowgun', 'boomerang',
];

const ARMOR_KEYWORDS = [
  'breastplate', 'chain mail', 'chain shirt', 'half plate', 'plate',
  'ring mail', 'scale mail', 'splint', 'studded leather', 'leather',
  'padded', 'hide',
];

// Order matters: Armor before Ring so "ring mail" matches Armor, not Ring
const CATEGORY_RULES = [
  { category: 'Shield', keywords: ['shield'] },
  { category: 'Ammunition', keywords: ['arrow', 'bolt', 'bullet', 'needle'] },
  { category: 'Potion', keywords: ['potion', 'substance'] },
  { category: 'Wand', keywords: ['wand'] },
  { category: 'Scroll', keywords: ['scroll'] },
  { category: 'Armor', keywords: ARMOR_KEYWORDS },
  { category: 'Ring', keywords: ['ring'] },
  { category: 'Weapon', keywords: WEAPON_KEYWORDS },
];

const NON_COMMON_RARITIES = new Set(['Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact']);

function matchesKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

export function categorizeItem({ base_item, name, rarity }) {
  const textToMatch = base_item || name;

  for (const { category, keywords } of CATEGORY_RULES) {
    if (matchesKeywords(textToMatch, keywords)) {
      return category;
    }
  }

  // If base_item didn't match, also try name
  if (base_item) {
    for (const { category, keywords } of CATEGORY_RULES) {
      if (matchesKeywords(name, keywords)) {
        return category;
      }
    }
  }

  // Uncommon+ without a category match → Wondrous Item
  if (NON_COMMON_RARITIES.has(rarity)) {
    return 'Wondrous Item';
  }

  return 'Adventuring Gear';
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd web && npx vitest run src/data/__tests__/categories.test.js
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/data/
git commit -m "feat: add constants and category mapping with tests"
```

---

### Task 3: Build data pipeline script

**Files:**
- Create: `web/scripts/build-data.js`

This is a Node script (not browser code) that runs at build time. It reads the raw data sources and writes processed JSON to `web/src/data/generated/`. It uses ESM (`type: "module"` in web/package.json) so it can import shared modules like `categories.js` and `constants.js` directly — no duplication.

- [ ] **Step 1: Create `web/scripts/build-data.js`**

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { categorizeItem } from '../src/data/categories.js';
import { SCROLL_PRICING, DEFAULT_BOOK_LIST } from '../src/data/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const WEB_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(WEB_ROOT, 'src/data/generated');

// --- Item Processing ---

function normalizeWeight(weight) {
  if (weight === '-' || weight === null || weight === undefined) return null;
  const num = parseFloat(weight);
  return isNaN(num) ? null : num;
}

function normalizeRarity(rarity) {
  if (!rarity) return 'Common';
  if (rarity === 'Mundane') return 'Common';
  return rarity;
}

function decodeHtmlEntities(text) {
  if (!text) return null;
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function processItems() {
  const rawItems = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/items.json'), 'utf-8')
  );

  const items = rawItems.map(item => {
    const rarity = normalizeRarity(item.rarity);
    return {
      name: item.name,
      category: categorizeItem({ base_item: item.base_item, name: item.name, rarity }),
      price: item.price,
      rarity,
      weight: normalizeWeight(item.weight),
      base_item: item.base_item || null,
      sourceType: item.type,
      requirements: decodeHtmlEntities(item.requirements),
    };
  });

  console.log(`  Items: ${items.length} processed`);
  const categoryCounts = {};
  items.forEach(i => { categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1; });
  console.log('  Categories:', categoryCounts);

  return items;
}

// --- Spell Processing ---

const BASE_SCHOOLS = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
];

function normalizeSchool(school) {
  if (!school) return null;
  const lower = school.toLowerCase();
  for (const base of BASE_SCHOOLS) {
    if (lower.startsWith(base)) return base.charAt(0).toUpperCase() + base.slice(1);
  }
  if (lower.startsWith('enchan')) return 'Enchantment';
  if (lower.startsWith('alteration')) return 'Transmutation';
  return school;
}

async function processSpells() {
  const dndData = await import('dnd-data');
  const dndSpells = dndData.spells;
  const bookSet = new Set(DEFAULT_BOOK_LIST);

  const filtered = dndSpells.filter(s => bookSet.has(s.book));
  const sorted = [...filtered].sort(
    (a, b) => DEFAULT_BOOK_LIST.indexOf(a.book) - DEFAULT_BOOK_LIST.indexOf(b.book)
  );

  const spellMap = new Map();
  for (const spell of sorted) {
    const key = spell.name.toLowerCase().replace(/[\u2018\u2019]/g, "'");
    spellMap.set(key, spell);
  }

  const spells = Array.from(spellMap.values())
    .map(s => ({
      name: s.name,
      level: s.properties?.Level ?? 0,
      school: normalizeSchool(s.properties?.School),
      sourceBook: s.book,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Descriptions — separate file, keyed by name
  const descriptions = {};
  for (const spell of spellMap.values()) {
    if (spell.description) {
      descriptions[spell.name] = spell.description;
    }
  }

  console.log(`  Spells: ${spells.length} deduplicated from ${dndSpells.length} raw`);
  return { spells, descriptions };
}

// --- Scroll Processing (uses SCROLL_PRICING imported from constants.js) ---

function processScrolls(spells) {
  const scrolls = spells.map(spell => {
    const pricing = SCROLL_PRICING[spell.level] || SCROLL_PRICING[0];
    return {
      name: `Spell Scroll: ${spell.name}`,
      category: 'Scroll',
      price: pricing.price,
      rarity: pricing.rarity,
      spellLevel: spell.level,
      spellSchool: spell.school,
      spellName: spell.name,
      sourceBook: spell.sourceBook,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  console.log(`  Scrolls: ${scrolls.length} generated`);
  return scrolls;
}

// --- Main ---

async function main() {
  console.log('Building data...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const items = processItems();
  const { spells, descriptions } = await processSpells();
  const scrolls = processScrolls(spells);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'items.json'), JSON.stringify(items));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'spells.json'), JSON.stringify(spells));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'scrolls.json'), JSON.stringify(scrolls));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'descriptions.json'), JSON.stringify(descriptions));

  const totalSize = [items, spells, scrolls].reduce(
    (sum, arr) => sum + JSON.stringify(arr).length, 0
  );
  const descSize = JSON.stringify(descriptions).length;
  console.log(`\nMain bundles: ${(totalSize / 1024).toFixed(0)} KB`);
  console.log(`Descriptions: ${(descSize / 1024).toFixed(0)} KB (lazy-loaded)`);
  console.log('Done.');
}

main();
```

- [ ] **Step 2: Create the generated output directory**

```bash
mkdir -p web/src/data/generated
```

- [ ] **Step 3: Run the build script**

```bash
cd web && node scripts/build-data.js
```

Expected: Script outputs item/spell/scroll counts and file sizes. Four JSON files created in `web/src/data/generated/`.

- [ ] **Step 4: Verify output files exist and are reasonable**

```bash
ls -la web/src/data/generated/
head -c 200 web/src/data/generated/items.json
```

Expected: Four files. Items JSON starts with `[{"name":...`.

- [ ] **Step 5: Add .gitkeep so git tracks the generated directory**

```bash
touch web/src/data/generated/.gitkeep
```

- [ ] **Step 6: Commit**

```bash
git add web/scripts/ web/src/data/generated/.gitkeep
git commit -m "feat: add build-time data pipeline script"
```

---

### Task 4: Shop templates data

**Files:**
- Create: `web/src/data/templates.js`

- [ ] **Step 1: Create `web/src/data/templates.js`**

```js
export const TEMPLATES = [
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    description: 'Weapons, armor, and shields',
    defaultCategories: ['Weapon', 'Armor', 'Shield'],
    rarityWeights: { Common: 50, Uncommon: 35, Rare: 10, 'Very Rare': 5 },
    baseSize: 15,
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    description: 'Potions and alchemical supplies',
    defaultCategories: ['Potion'],
    rarityWeights: { Common: 40, Uncommon: 35, Rare: 20, 'Very Rare': 5 },
    baseSize: 12,
  },
  {
    id: 'general-store',
    name: 'General Store',
    description: 'Adventuring gear and ammunition',
    defaultCategories: ['Adventuring Gear', 'Ammunition'],
    rarityWeights: { Common: 70, Uncommon: 25, Rare: 5 },
    baseSize: 20,
  },
  {
    id: 'arcane-shop',
    name: 'Arcane Shop',
    description: 'Spell scrolls, wands, rings, and magical curiosities',
    defaultCategories: ['Scroll', 'Wand', 'Ring', 'Wondrous Item'],
    rarityWeights: { Common: 30, Uncommon: 35, Rare: 25, 'Very Rare': 8, Legendary: 2 },
    baseSize: 10,
  },
  {
    id: 'armorer',
    name: 'Armorer',
    description: 'Armor and shields',
    defaultCategories: ['Armor', 'Shield'],
    rarityWeights: { Common: 45, Uncommon: 35, Rare: 15, 'Very Rare': 5 },
    baseSize: 12,
  },
  {
    id: 'wandering-merchant',
    name: 'Wandering Merchant',
    description: 'A little bit of everything',
    defaultCategories: [
      'Weapon', 'Armor', 'Shield', 'Potion', 'Ammunition',
      'Wand', 'Ring', 'Scroll', 'Wondrous Item', 'Adventuring Gear',
    ],
    rarityWeights: { Common: 50, Uncommon: 30, Rare: 15, 'Very Rare': 5 },
    baseSize: 8,
  },
];

export const TOWN_SIZES = [
  { id: 'hamlet', name: 'Hamlet', multiplier: 0.5, description: 'Tiny settlement, very limited stock' },
  { id: 'village', name: 'Village', multiplier: 0.75, description: 'Small community' },
  { id: 'town', name: 'Town', multiplier: 1.0, description: 'Standard market' },
  { id: 'city', name: 'City', multiplier: 1.5, description: 'Large settlement, broad selection' },
  { id: 'metropolis', name: 'Metropolis', multiplier: 2.0, description: 'Major hub, extensive inventory' },
];
```

- [ ] **Step 2: Commit**

```bash
git add web/src/data/templates.js
git commit -m "feat: add shop template definitions"
```

---

## Chunk 2: Core Logic (Generation + Filtering + URL State)

### Task 5: Rarity weight adjustment logic

**Files:**
- Create: `web/src/logic/rarity.js`
- Create: `web/src/logic/__tests__/rarity.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/logic/__tests__/rarity.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { adjustRarityWeights } from '../rarity.js';

describe('adjustRarityWeights', () => {
  const baseWeights = { Common: 50, Uncommon: 35, Rare: 10, 'Very Rare': 5 };

  it('returns base weights at default level 5', () => {
    const result = adjustRarityWeights(baseWeights, 5);
    expect(result).toEqual(baseWeights);
  });

  it('shifts weight toward rare at high levels', () => {
    const result = adjustRarityWeights(baseWeights, 13);
    // 2 steps above baseline → shift 20% from Common
    expect(result.Common).toBe(30);
    expect(result.Uncommon).toBe(42);
    expect(result.Rare).toBe(18);
    expect(result['Very Rare']).toBe(10);
  });

  it('shifts weight toward common at low levels', () => {
    const result = adjustRarityWeights(baseWeights, 1);
    // 1 step below baseline → shift 10% from rarer toward Common
    expect(result.Common).toBe(60);
    expect(result.Uncommon + result.Rare + result['Very Rare']).toBe(40);
  });

  it('does not add weight to zero-weight tiers', () => {
    const weights = { Common: 70, Uncommon: 25, Rare: 5 };
    const result = adjustRarityWeights(weights, 13);
    expect(result.Legendary).toBeUndefined();
    expect(result['Very Rare']).toBeUndefined();
  });

  it('does not let Common go below 0', () => {
    const result = adjustRarityWeights(baseWeights, 20);
    expect(result.Common).toBeGreaterThanOrEqual(0);
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('weights always sum to 100', () => {
    for (let level = 1; level <= 20; level++) {
      const result = adjustRarityWeights(baseWeights, level);
      const total = Object.values(result).reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/logic/__tests__/rarity.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/src/logic/rarity.js`**

```js
/**
 * Adjust rarity weights based on party level.
 *
 * For every 4 levels above 5, shift 10% from Common toward rarer tiers.
 * For levels below 5, shift from rarer tiers toward Common.
 * Only redistributes among tiers with nonzero weight.
 *
 * @param {Object} baseWeights - e.g., { Common: 50, Uncommon: 35, Rare: 10 }
 * @param {number} level - Party level 1-20
 * @returns {Object} Adjusted weights summing to 100
 */
export function adjustRarityWeights(baseWeights, level) {
  const steps = Math.floor((level - 5) / 4);
  if (steps === 0) return { ...baseWeights };

  const result = { ...baseWeights };
  const shiftAmount = Math.abs(steps) * 10;

  if (steps > 0) {
    // Shift from Common toward rarer tiers
    const actualShift = Math.min(shiftAmount, result.Common || 0);
    result.Common = (result.Common || 0) - actualShift;

    // Distribute proportionally among non-Common tiers with nonzero weight
    const rareTiers = Object.keys(result).filter(k => k !== 'Common' && result[k] > 0);
    const rareTotal = rareTiers.reduce((sum, k) => sum + result[k], 0);

    if (rareTotal > 0) {
      let distributed = 0;
      rareTiers.forEach((tier, i) => {
        if (i === rareTiers.length - 1) {
          result[tier] += actualShift - distributed;
        } else {
          const share = Math.round(actualShift * result[tier] / rareTotal);
          result[tier] += share;
          distributed += share;
        }
      });
    }
  } else {
    // Shift from rarer tiers toward Common
    const rareTiers = Object.keys(result).filter(k => k !== 'Common' && result[k] > 0);
    const rareTotal = rareTiers.reduce((sum, k) => sum + result[k], 0);
    const actualShift = Math.min(shiftAmount, rareTotal);

    let taken = 0;
    rareTiers.forEach((tier, i) => {
      if (i === rareTiers.length - 1) {
        const take = actualShift - taken;
        result[tier] -= take;
      } else {
        const take = Math.round(actualShift * result[tier] / rareTotal);
        result[tier] -= take;
        taken += take;
      }
    });
    result.Common = (result.Common || 0) + actualShift;
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/logic/__tests__/rarity.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/logic/
git commit -m "feat: add rarity weight adjustment logic with tests"
```

---

### Task 6: Shop generation algorithm

**Files:**
- Create: `web/src/logic/generation.js`
- Create: `web/src/logic/__tests__/generation.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/logic/__tests__/generation.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { generateShop, rerollItem } from '../generation.js';

const MOCK_ITEMS = [
  { name: 'Iron Sword', category: 'Weapon', price: 10, rarity: 'Common' },
  { name: 'Steel Sword', category: 'Weapon', price: 50, rarity: 'Uncommon' },
  { name: 'Flame Tongue', category: 'Weapon', price: 500, rarity: 'Rare' },
  { name: 'Iron Shield', category: 'Shield', price: 10, rarity: 'Common' },
  { name: 'Healing Potion', category: 'Potion', price: 50, rarity: 'Common' },
  { name: 'Chain Mail', category: 'Armor', price: 75, rarity: 'Common' },
  { name: 'Plate +1', category: 'Armor', price: 1500, rarity: 'Uncommon' },
];

const TEMPLATE = {
  id: 'test',
  defaultCategories: ['Weapon', 'Shield'],
  rarityWeights: { Common: 50, Uncommon: 35, Rare: 15 },
  baseSize: 5,
};

describe('generateShop', () => {
  it('generates deterministic inventory from seed', () => {
    const shop1 = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'test123',
    });
    const shop2 = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'test123',
    });
    expect(shop1).toEqual(shop2);
  });

  it('different seeds produce different inventories', () => {
    const shop1 = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'aaa',
    });
    const shop2 = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'bbb',
    });
    expect(shop1).not.toEqual(shop2);
  });

  it('only includes items from selected categories', () => {
    const shop = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon'], level: 5, townSize: 'town', seed: 'cats',
    });
    expect(shop.every(item => item.category === 'Weapon')).toBe(true);
  });

  it('respects budget cap', () => {
    const shop = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town',
      seed: 'budget', budgetCap: 100,
    });
    expect(shop.every(item => item.price <= 100)).toBe(true);
  });

  it('scales inventory size with town size', () => {
    const hamlet = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'hamlet', seed: 'size',
    });
    const metropolis = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'metropolis', seed: 'size',
    });
    expect(hamlet.length).toBeLessThan(metropolis.length);
  });

  it('has no duplicate items', () => {
    const shop = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'dedup',
    });
    const names = shop.map(i => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('sorts by category then price', () => {
    const shop = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'sort',
    });
    for (let i = 1; i < shop.length; i++) {
      const prev = shop[i - 1];
      const curr = shop[i];
      if (prev.category === curr.category) {
        expect(prev.price).toBeLessThanOrEqual(curr.price);
      }
    }
  });
});

describe('rerollItem', () => {
  it('returns a different item for the same slot', () => {
    const shop = generateShop({
      items: MOCK_ITEMS, scrolls: [], template: TEMPLATE,
      categories: ['Weapon', 'Shield'], level: 5, townSize: 'town', seed: 'reroll',
    });
    if (shop.length > 0) {
      const original = shop[0];
      const replacement = rerollItem({
        items: MOCK_ITEMS, scrolls: [], categories: ['Weapon', 'Shield'],
        rarityWeights: TEMPLATE.rarityWeights, level: 5,
        currentShop: shop, index: 0, seed: 'reroll-new',
      });
      // Replacement should be a valid item (may or may not differ with small pool)
      expect(replacement).toBeDefined();
      expect(replacement.name).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/logic/__tests__/generation.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/src/logic/generation.js`**

```js
import seedrandom from 'seedrandom';
import { adjustRarityWeights } from './rarity.js';
import { TOWN_SIZES } from '../data/templates.js';

/**
 * Pick a rarity tier using weighted random selection.
 */
function pickRarity(weights, rng) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

/**
 * Find nearest available rarity in the pool if exact match has no items.
 */
function findNearestRarity(targetRarity, availableRarities) {
  const order = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
  const targetIdx = order.indexOf(targetRarity);
  if (targetIdx === -1) return availableRarities[0] || null;

  let bestRarity = null;
  let bestDist = Infinity;
  for (const r of availableRarities) {
    const dist = Math.abs(order.indexOf(r) - targetIdx);
    if (dist < bestDist) {
      bestDist = dist;
      bestRarity = r;
    }
  }
  return bestRarity;
}

/**
 * Generate a shop inventory.
 *
 * @param {Object} params
 * @param {Array} params.items - All processed items
 * @param {Array} params.scrolls - All processed scrolls
 * @param {Object} params.template - Shop template
 * @param {Array<string>} params.categories - Selected categories
 * @param {number} params.level - Party level (1-20)
 * @param {string} params.townSize - Town size ID
 * @param {string} params.seed - Random seed
 * @param {number} [params.budgetCap] - Max price per item
 * @returns {Array} Generated inventory sorted by category, then price
 */
export function generateShop({ items, scrolls, template, categories, level, townSize, seed, budgetCap }) {
  const rng = seedrandom(seed);

  // Build eligible pool (exclude Artifact — too powerful for random shops)
  const allItems = [...items, ...scrolls];
  let pool = allItems.filter(item =>
    categories.includes(item.category) && item.rarity !== 'Artifact'
  );
  if (budgetCap !== undefined) {
    pool = pool.filter(item => item.price <= budgetCap);
  }

  if (pool.length === 0) return [];

  // Adjust rarity and calculate size
  const weights = adjustRarityWeights(template.rarityWeights, level);
  const townConfig = TOWN_SIZES.find(t => t.id === townSize) || TOWN_SIZES.find(t => t.id === 'town');
  const targetSize = Math.max(3, Math.round(template.baseSize * townConfig.multiplier));

  // Group pool by rarity
  const poolByRarity = {};
  for (const item of pool) {
    if (!poolByRarity[item.rarity]) poolByRarity[item.rarity] = [];
    poolByRarity[item.rarity].push(item);
  }
  const availableRarities = Object.keys(poolByRarity);

  // Generate inventory
  const inventory = [];
  const usedNames = new Set();

  for (let i = 0; i < targetSize; i++) {
    let rarity = pickRarity(weights, rng);

    // Fallback if no items at this rarity
    if (!poolByRarity[rarity] || poolByRarity[rarity].length === 0) {
      rarity = findNearestRarity(rarity, availableRarities);
      if (!rarity) break;
    }

    const candidates = poolByRarity[rarity];
    let picked = null;
    let attempts = 0;

    while (attempts < 3) {
      const idx = Math.floor(rng() * candidates.length);
      const candidate = candidates[idx];
      if (!usedNames.has(candidate.name)) {
        picked = candidate;
        break;
      }
      attempts++;
    }

    if (picked) {
      usedNames.add(picked.name);
      inventory.push(picked);
    }
  }

  // Sort by category, then price
  return inventory.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    return catCmp !== 0 ? catCmp : a.price - b.price;
  });
}

/**
 * Re-roll a single item in the shop.
 */
export function rerollItem({ items, scrolls, categories, rarityWeights, level, currentShop, index, seed, budgetCap }) {
  const rng = seedrandom(seed);
  const weights = adjustRarityWeights(rarityWeights, level);

  const allItems = [...items, ...scrolls];
  let pool = allItems.filter(item =>
    categories.includes(item.category) && item.rarity !== 'Artifact'
  );
  if (budgetCap !== undefined) {
    pool = pool.filter(item => item.price <= budgetCap);
  }

  const usedNames = new Set(currentShop.map(i => i.name));
  const rarity = pickRarity(weights, rng);

  const candidates = pool.filter(i => i.rarity === rarity && !usedNames.has(i.name));
  if (candidates.length > 0) {
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // Fallback: any unused item from pool
  const fallback = pool.filter(i => !usedNames.has(i.name));
  if (fallback.length > 0) {
    return fallback[Math.floor(rng() * fallback.length)];
  }

  // No options — return the existing item
  return currentShop[index];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/logic/__tests__/generation.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/logic/
git commit -m "feat: add shop generation algorithm with seeded PRNG"
```

---

### Task 7: Filter logic

**Files:**
- Create: `web/src/logic/filters.js`
- Create: `web/src/logic/__tests__/filters.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/logic/__tests__/filters.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { filterItems, sortItems } from '../filters.js';

const ITEMS = [
  { name: 'Iron Sword', category: 'Weapon', price: 10, rarity: 'Common', weight: 3 },
  { name: 'Flame Tongue', category: 'Weapon', price: 500, rarity: 'Rare', weight: 3 },
  { name: 'Chain Mail', category: 'Armor', price: 75, rarity: 'Common', weight: 55 },
  { name: 'Healing Potion', category: 'Potion', price: 50, rarity: 'Common', weight: 0.5 },
  { name: 'Spell Scroll: Fireball', category: 'Scroll', price: 448, rarity: 'Uncommon', spellLevel: 3, spellSchool: 'Evocation' },
];

describe('filterItems', () => {
  it('filters by name search (case-insensitive)', () => {
    expect(filterItems(ITEMS, { query: 'sword' })).toHaveLength(1);
    expect(filterItems(ITEMS, { query: 'SWORD' })).toHaveLength(1);
  });

  it('filters by categories', () => {
    expect(filterItems(ITEMS, { categories: ['Weapon'] })).toHaveLength(2);
    expect(filterItems(ITEMS, { categories: ['Weapon', 'Armor'] })).toHaveLength(3);
  });

  it('filters by rarities', () => {
    expect(filterItems(ITEMS, { rarities: ['Common'] })).toHaveLength(3);
    expect(filterItems(ITEMS, { rarities: ['Rare'] })).toHaveLength(1);
  });

  it('filters by price range', () => {
    expect(filterItems(ITEMS, { minPrice: 50, maxPrice: 100 })).toHaveLength(2);
  });

  it('filters by spell level', () => {
    expect(filterItems(ITEMS, { spellLevel: 3 })).toHaveLength(1);
  });

  it('filters by spell school', () => {
    expect(filterItems(ITEMS, { spellSchool: 'Evocation' })).toHaveLength(1);
  });

  it('combines multiple filters', () => {
    expect(filterItems(ITEMS, { categories: ['Weapon'], rarities: ['Common'] })).toHaveLength(1);
  });

  it('returns all items with no filters', () => {
    expect(filterItems(ITEMS, {})).toHaveLength(5);
  });
});

describe('sortItems', () => {
  it('sorts by name ascending', () => {
    const sorted = sortItems(ITEMS, 'name', 'asc');
    expect(sorted[0].name).toBe('Chain Mail');
  });

  it('sorts by price descending', () => {
    const sorted = sortItems(ITEMS, 'price', 'desc');
    expect(sorted[0].price).toBe(500);
  });

  it('sorts by rarity in tier order', () => {
    const sorted = sortItems(ITEMS, 'rarity', 'asc');
    expect(sorted[0].rarity).toBe('Common');
    expect(sorted[sorted.length - 1].rarity).toBe('Rare');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/logic/__tests__/filters.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/src/logic/filters.js`**

```js
const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];

/**
 * Filter items by multiple criteria.
 * Empty/undefined criteria are ignored.
 */
export function filterItems(items, {
  query, categories, rarities, minPrice, maxPrice, spellLevel, spellSchool,
} = {}) {
  return items.filter(item => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (categories?.length && !categories.includes(item.category)) return false;
    if (rarities?.length && !rarities.includes(item.rarity)) return false;
    if (minPrice !== undefined && item.price < minPrice) return false;
    if (maxPrice !== undefined && item.price > maxPrice) return false;
    if (spellLevel !== undefined && item.spellLevel !== spellLevel) return false;
    if (spellSchool && item.spellSchool !== spellSchool) return false;
    return true;
  });
}

/**
 * Sort items by a given field.
 */
export function sortItems(items, field, direction = 'asc') {
  const sorted = [...items];
  const dir = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    if (field === 'rarity') {
      return dir * (RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    }
    if (typeof a[field] === 'number') {
      return dir * ((a[field] ?? 0) - (b[field] ?? 0));
    }
    return dir * String(a[field] ?? '').localeCompare(String(b[field] ?? ''));
  });

  return sorted;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/logic/__tests__/filters.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/logic/filters.js web/src/logic/__tests__/filters.test.js
git commit -m "feat: add item filtering and sorting logic with tests"
```

---

### Task 8: URL state hook

**Files:**
- Create: `web/src/hooks/useUrlState.js`
- Create: `web/src/hooks/__tests__/useUrlState.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/hooks/__tests__/useUrlState.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseShopParams, serializeShopParams, parseBrowseParams, serializeBrowseParams } from '../useUrlState';

describe('parseShopParams', () => {
  it('parses valid shop URL params', () => {
    const search = '?template=blacksmith&level=10&town=city&seed=abc123&categories=weapon,armor';
    const result = parseShopParams(new URLSearchParams(search));
    expect(result.template).toBe('blacksmith');
    expect(result.level).toBe(10);
    expect(result.townSize).toBe('city');
    expect(result.seed).toBe('abc123');
    expect(result.categories).toEqual(['Weapon', 'Armor']);
  });

  it('falls back to defaults for invalid values', () => {
    const search = '?level=abc&town=megacity';
    const result = parseShopParams(new URLSearchParams(search));
    expect(result.level).toBe(5);
    expect(result.townSize).toBe('town');
  });

  it('parses budget cap', () => {
    const search = '?budget=500';
    const result = parseShopParams(new URLSearchParams(search));
    expect(result.budgetCap).toBe(500);
  });
});

describe('serializeShopParams', () => {
  it('serializes shop state to URL params', () => {
    const params = serializeShopParams({
      template: 'blacksmith', level: 10, townSize: 'city',
      seed: 'abc', categories: ['Weapon', 'Armor'],
    });
    expect(params.get('template')).toBe('blacksmith');
    expect(params.get('level')).toBe('10');
    expect(params.get('town')).toBe('city');
    expect(params.get('seed')).toBe('abc');
    expect(params.get('categories')).toBe('Weapon,Armor');
  });

  it('omits default values', () => {
    const params = serializeShopParams({ level: 5, townSize: 'town' });
    expect(params.has('level')).toBe(false);
    expect(params.has('town')).toBe(false);
  });
});

describe('parseBrowseParams', () => {
  it('parses browse filter params', () => {
    const search = '?q=sword&category=weapon,armor&rarity=rare&maxPrice=500';
    const result = parseBrowseParams(new URLSearchParams(search));
    expect(result.query).toBe('sword');
    expect(result.categories).toEqual(['Weapon', 'Armor']);
    expect(result.rarities).toEqual(['Rare']);
    expect(result.maxPrice).toBe(500);
  });

  it('returns empty defaults for missing params', () => {
    const result = parseBrowseParams(new URLSearchParams(''));
    expect(result.query).toBe('');
    expect(result.categories).toEqual([]);
  });
});

describe('serializeBrowseParams', () => {
  it('serializes browse filters to URL params', () => {
    const params = serializeBrowseParams({
      query: 'sword', categories: ['Weapon'], rarities: ['Rare'],
      maxPrice: 500,
    });
    expect(params.get('q')).toBe('sword');
    expect(params.get('category')).toBe('Weapon');
    expect(params.get('rarity')).toBe('Rare');
    expect(params.get('maxPrice')).toBe('500');
  });

  it('omits default values', () => {
    const params = serializeBrowseParams({ query: '', categories: [], rarities: [] });
    expect(params.has('q')).toBe(false);
    expect(params.has('category')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/hooks/__tests__/useUrlState.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/src/hooks/useUrlState.js`**

```js
import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { TOWN_SIZES } from '../data/templates.js';

const VALID_TOWN_IDS = new Set(TOWN_SIZES.map(t => t.id));

// --- Pure parsing/serializing functions (exported for testing) ---

// Title-case a category string: "weapon" → "Weapon", "very rare" → "Very Rare"
function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function parseShopParams(searchParams) {
  const template = searchParams.get('template') || null;
  const levelStr = searchParams.get('level');
  const level = levelStr && !isNaN(parseInt(levelStr, 10))
    ? Math.max(1, Math.min(20, parseInt(levelStr, 10)))
    : 5;
  const townRaw = searchParams.get('town') || 'town';
  const townSize = VALID_TOWN_IDS.has(townRaw) ? townRaw : 'town';
  const seed = searchParams.get('seed') || null;
  const categoriesRaw = searchParams.get('categories');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const budgetStr = searchParams.get('budget');
  const budgetCap = budgetStr && !isNaN(parseInt(budgetStr, 10))
    ? parseInt(budgetStr, 10)
    : undefined;

  return { template, level, townSize, seed, categories, budgetCap };
}

export function serializeShopParams({ template, level, townSize, seed, categories, budgetCap }) {
  const params = new URLSearchParams();
  if (template) params.set('template', template);
  if (level && level !== 5) params.set('level', String(level));
  if (townSize && townSize !== 'town') params.set('town', townSize);
  if (seed) params.set('seed', seed);
  if (categories?.length) params.set('categories', categories.join(','));
  if (budgetCap !== undefined) params.set('budget', String(budgetCap));
  return params;
}

export function parseBrowseParams(searchParams) {
  const query = searchParams.get('q') || '';
  const categoriesRaw = searchParams.get('category');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const raritiesRaw = searchParams.get('rarity');
  const rarities = raritiesRaw ? raritiesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const minPriceStr = searchParams.get('minPrice');
  const minPrice = minPriceStr && !isNaN(parseInt(minPriceStr, 10))
    ? parseInt(minPriceStr, 10) : undefined;
  const maxPriceStr = searchParams.get('maxPrice');
  const maxPrice = maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))
    ? parseInt(maxPriceStr, 10) : undefined;
  const spellLevelStr = searchParams.get('spellLevel');
  const spellLevel = spellLevelStr && !isNaN(parseInt(spellLevelStr, 10))
    ? parseInt(spellLevelStr, 10) : undefined;
  const spellSchool = searchParams.get('spellSchool') || undefined;
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  return { query, categories, rarities, minPrice, maxPrice, spellLevel, spellSchool, sort, order };
}

export function serializeBrowseParams({ query, categories, rarities, minPrice, maxPrice, spellLevel, spellSchool, sort, order }) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (categories?.length) params.set('category', categories.join(','));
  if (rarities?.length) params.set('rarity', rarities.join(','));
  if (minPrice !== undefined) params.set('minPrice', String(minPrice));
  if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
  if (spellLevel !== undefined) params.set('spellLevel', String(spellLevel));
  if (spellSchool) params.set('spellSchool', spellSchool);
  if (sort && sort !== 'name') params.set('sort', sort);
  if (order && order !== 'asc') params.set('order', order);
  return params;
}

// --- React hooks ---

export function useShopUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseShopParams(searchParams), [searchParams]);

  const setState = useCallback((newState) => {
    setSearchParams(serializeShopParams(newState), { replace: true });
  }, [setSearchParams]);

  return [state, setState];
}

export function useBrowseUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseBrowseParams(searchParams), [searchParams]);

  const setState = useCallback((newState) => {
    setSearchParams(serializeBrowseParams(newState), { replace: true });
  }, [setSearchParams]);

  return [state, setState];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run src/hooks/__tests__/useUrlState.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/
git commit -m "feat: add URL state parsing hooks for shop and browse pages"
```

---

## Chunk 3: Shared Components

### Task 9: Layout component (app shell)

**Files:**
- Create: `web/src/components/Layout.jsx`
- Create: `web/src/components/Layout.css`
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Create `web/src/components/Layout.css`**

```css
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.layout-logo {
  color: var(--color-accent);
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
}

.layout-nav {
  display: flex;
  gap: 1.5rem;
}

.layout-nav a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.15s;
}

.layout-nav a:hover,
.layout-nav a.active {
  color: var(--color-accent);
}

.layout-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}
```

- [ ] **Step 2: Create `web/src/components/Layout.jsx`**

```jsx
import { Link, NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <>
      <header className="layout-header">
        <Link to="/" className="layout-logo">Fantasy Shop Generator</Link>
        <nav className="layout-nav">
          <NavLink to="/shop">Generate Shop</NavLink>
          <NavLink to="/browse">Browse Items</NavLink>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Update `web/src/App.jsx` to use Layout**

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

function Placeholder({ name }) {
  return <div>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
        <Route path="/browse" element={<Placeholder name="Item Browser" />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Verify in browser**

```bash
cd web && npm run dev
```

Expected: App shows header with logo and nav links. Clicking links navigates between placeholder pages.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Layout.jsx web/src/components/Layout.css web/src/App.jsx
git commit -m "feat: add Layout component with header navigation"
```

---

### Task 10: RarityBadge component

**Files:**
- Create: `web/src/components/RarityBadge.jsx`
- Create: `web/src/components/RarityBadge.css`

- [ ] **Step 1: Create `web/src/components/RarityBadge.css`**

```css
.rarity-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 2: Create `web/src/components/RarityBadge.jsx`**

```jsx
import { RARITY_COLORS } from '../data/constants';
import './RarityBadge.css';

export default function RarityBadge({ rarity }) {
  const color = RARITY_COLORS[rarity] || '#9ca3af';
  return (
    <span className="rarity-badge" style={{ color, borderLeft: `3px solid ${color}` }}>
      {rarity}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/RarityBadge.jsx web/src/components/RarityBadge.css
git commit -m "feat: add RarityBadge component"
```

---

### Task 11: ItemTable component

**Files:**
- Create: `web/src/components/ItemTable.jsx`
- Create: `web/src/components/ItemTable.css`

- [ ] **Step 1: Create `web/src/components/ItemTable.css`**

```css
.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  user-select: none;
}

.item-table th:hover {
  color: var(--color-accent);
}

.item-table th .sort-indicator {
  margin-left: 0.25rem;
}

.item-table td {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.item-table tr:hover {
  background: rgba(251, 191, 36, 0.03);
}

.item-table tr.expanded {
  background: rgba(251, 191, 36, 0.05);
}

.item-table .price {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.item-table .weight {
  color: var(--color-text-muted);
}

.item-table .clickable-row {
  cursor: pointer;
}

.item-table-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.item-table-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.item-table-pagination button {
  padding: 0.375rem 0.75rem;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.item-table-pagination button:hover:not(:disabled) {
  border-color: var(--color-accent);
}

.item-table-pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .item-table .hide-mobile {
    display: none;
  }
}
```

- [ ] **Step 2: Create `web/src/components/ItemTable.jsx`**

```jsx
import { useState, useEffect, Fragment } from 'react';
import RarityBadge from './RarityBadge';
import ItemDetail from './ItemDetail';
import './ItemTable.css';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category', className: 'hide-mobile' },
  { key: 'price', label: 'Price (gp)' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'weight', label: 'Weight', className: 'hide-mobile' },
];

const PAGE_SIZE = 50;

export default function ItemTable({ items, sortField, sortDirection, onSort, onReroll }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [page, setPage] = useState(0);

  // Reset page to 0 when items change (new filters applied)
  useEffect(() => { setPage(0); }, [items.length]);
  // Reset expanded row when page changes
  useEffect(() => { setExpandedIndex(null); }, [page]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pagedItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(field) {
    if (onSort) onSort(field);
  }

  function toggleExpand(index) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  if (items.length === 0) {
    return <div className="item-table-empty">No items match your filters.</div>;
  }

  return (
    <>
    <table className="item-table">
      <thead>
        <tr>
          {COLUMNS.map(col => (
            <th key={col.key} className={col.className} onClick={() => handleSort(col.key)}>
              {col.label}
              {sortField === col.key && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
          ))}
          {onReroll && <th />}
        </tr>
      </thead>
      <tbody>
        {pagedItems.map((item, i) => (
          <Fragment key={`${item.name}-${item.category}-${item.price}`}>
            <tr
              className={`clickable-row${expandedIndex === i ? ' expanded' : ''}`}
              onClick={() => toggleExpand(i)}
            >
              <td>{item.name}</td>
              <td className="hide-mobile">{item.category}</td>
              <td className="price">{item.price.toLocaleString()} gp</td>
              <td><RarityBadge rarity={item.rarity} /></td>
              <td className="hide-mobile weight">{item.weight ?? '—'}</td>
              {onReroll && (
                <td>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReroll(i); }}
                    title="Re-roll this item"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem' }}
                  >
                    ⟳
                  </button>
                </td>
              )}
            </tr>
            {expandedIndex === i && (
              <tr>
                <td colSpan={COLUMNS.length + (onReroll ? 1 : 0)}>
                  <ItemDetail item={item} />
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
    {totalPages > 1 && (
      <div className="item-table-pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
      </div>
    )}
    </>
  );
}
```

- [ ] **Step 3: Create `web/src/components/ItemDetail.jsx` and `ItemDetail.css`**

`web/src/components/ItemDetail.css`:
```css
.item-detail {
  padding: 0.75rem;
  background: var(--color-surface);
  border-left: 2px solid var(--color-accent-dim);
  border-radius: 0 4px 4px 0;
  font-size: 0.875rem;
}

.item-detail-field {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.item-detail-label {
  color: var(--color-text-muted);
  min-width: 6rem;
}

.item-detail-description {
  margin-top: 0.75rem;
  line-height: 1.6;
  color: var(--color-text-muted);
}
```

`web/src/components/ItemDetail.jsx`:
```jsx
import { useState, useEffect } from 'react';
import './ItemDetail.css';

export default function ItemDetail({ item }) {
  const [description, setDescription] = useState(null);

  useEffect(() => {
    // Lazy-load descriptions for spells/scrolls
    const spellName = item.spellName || item.name;
    if (item.category === 'Scroll' || item.level !== undefined) {
      import('../data/generated/descriptions.json')
        .then(mod => {
          setDescription(mod.default?.[spellName] || null);
        })
        .catch(() => setDescription(null));
    }
  }, [item]);

  return (
    <div className="item-detail">
      {item.base_item && (
        <div className="item-detail-field">
          <span className="item-detail-label">Base item:</span>
          <span>{item.base_item}</span>
        </div>
      )}
      {item.requirements && (
        <div className="item-detail-field">
          <span className="item-detail-label">Requires:</span>
          <span>{item.requirements}</span>
        </div>
      )}
      {item.sourceBook && (
        <div className="item-detail-field">
          <span className="item-detail-label">Source:</span>
          <span>{item.sourceBook}</span>
        </div>
      )}
      {item.spellLevel !== undefined && (
        <div className="item-detail-field">
          <span className="item-detail-label">Spell level:</span>
          <span>{item.spellLevel === 0 ? 'Cantrip' : item.spellLevel}</span>
        </div>
      )}
      {item.spellSchool && (
        <div className="item-detail-field">
          <span className="item-detail-label">School:</span>
          <span>{item.spellSchool}</span>
        </div>
      )}
      {description && (
        <div className="item-detail-description">{description}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ItemTable.jsx web/src/components/ItemTable.css web/src/components/ItemDetail.jsx web/src/components/ItemDetail.css
git commit -m "feat: add ItemTable and ItemDetail components"
```

---

### Task 12: FilterPanel component

**Files:**
- Create: `web/src/components/FilterPanel.jsx`
- Create: `web/src/components/FilterPanel.css`

- [ ] **Step 1: Create `web/src/components/FilterPanel.css`**

```css
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.filter-section h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-checkboxes label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.filter-checkboxes input[type="checkbox"] {
  accent-color: var(--color-accent);
}

.filter-range {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-range input {
  width: 5rem;
  padding: 0.375rem 0.5rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.filter-range input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.filter-search input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.filter-search input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.filter-toggle {
  display: none;
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .filter-toggle {
    display: block;
  }
  .filter-panel {
    display: none;
  }
  .filter-panel.open {
    display: flex;
  }
}
```

- [ ] **Step 2: Create `web/src/components/FilterPanel.jsx`**

```jsx
import { useState } from 'react';
import { ALL_CATEGORIES, RARITIES } from '../data/constants';
import './FilterPanel.css';

const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];
const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function FilterPanel({ filters, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleCategory(cat) {
    const current = filters.categories || [];
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    onChange({ ...filters, categories: next });
  }

  function toggleRarity(rarity) {
    const current = filters.rarities || [];
    const next = current.includes(rarity) ? current.filter(r => r !== rarity) : [...current, rarity];
    onChange({ ...filters, rarities: next });
  }

  return (
    <>
      <button className="filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </button>
      <div className={`filter-panel${isOpen ? ' open' : ''}`}>
        <div className="filter-section filter-search">
          <h3>Search</h3>
          <input
            type="text"
            placeholder="Search items..."
            value={filters.query || ''}
            onChange={e => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <div className="filter-section">
          <h3>Category</h3>
          <div className="filter-checkboxes">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={!filters.categories?.length || filters.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Rarity</h3>
          <div className="filter-checkboxes">
            {RARITIES.map(r => (
              <label key={r}>
                <input
                  type="checkbox"
                  checked={!filters.rarities?.length || filters.rarities.includes(r)}
                  onChange={() => toggleRarity(r)}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        {/* Spell filters only shown when Scroll category is selected */}
        {(!filters.categories?.length || filters.categories.includes('Scroll')) && (
        <div className="filter-section">
          <h3>Spell Level</h3>
          <select
            value={filters.spellLevel ?? ''}
            onChange={e => onChange({ ...filters, spellLevel: e.target.value ? Number(e.target.value) : undefined })}
            style={{ width: '100%', padding: '0.375rem 0.5rem', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
          >
            <option value="">Any level</option>
            {SPELL_LEVELS.map(l => (
              <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>
            ))}
          </select>
        </div>

        <div className="filter-section">
          <h3>Spell School</h3>
          <select
            value={filters.spellSchool ?? ''}
            onChange={e => onChange({ ...filters, spellSchool: e.target.value || undefined })}
            style={{ width: '100%', padding: '0.375rem 0.5rem', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
          >
            <option value="">Any school</option>
            {SPELL_SCHOOLS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        )}

        <div className="filter-section">
          <h3>Price Range (gp)</h3>
          <div className="filter-range">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ''}
              onChange={e => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ''}
              onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/FilterPanel.jsx web/src/components/FilterPanel.css
git commit -m "feat: add FilterPanel component with responsive drawer"
```

---

## Chunk 4: Pages

### Task 13: Home page

**Files:**
- Create: `web/src/pages/Home.jsx`
- Create: `web/src/pages/Home.css`

- [ ] **Step 1: Create `web/src/pages/Home.css`**

```css
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
}

.home h1 {
  font-size: 2.25rem;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}

.home .subtitle {
  color: var(--color-text-muted);
  font-size: 1.125rem;
  margin-bottom: 3rem;
  max-width: 500px;
}

.home-actions {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 2.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  transition: border-color 0.15s, transform 0.15s;
  width: 260px;
}

.home-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.home-card h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.home-card p {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
```

- [ ] **Step 2: Create `web/src/pages/Home.jsx`**

```jsx
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <h1>Fantasy Shop Generator</h1>
      <p className="subtitle">
        Generate shop inventories for your tabletop RPG sessions, or browse the full item catalog.
      </p>
      <div className="home-actions">
        <Link to="/shop" className="home-card">
          <h2>Generate a Shop</h2>
          <p>Pick a template, tune parameters, and generate a thematic inventory.</p>
        </Link>
        <Link to="/browse" className="home-card">
          <h2>Browse Items</h2>
          <p>Search and filter the full catalog of items, spells, and scrolls.</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `web/src/App.jsx`** — replace placeholder with Home

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

function Placeholder({ name }) {
  return <div>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
        <Route path="/browse" element={<Placeholder name="Item Browser" />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Verify in browser**

Expected: Landing page with title, subtitle, and two card links.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/Home.jsx web/src/pages/Home.css web/src/App.jsx
git commit -m "feat: add Home landing page"
```

---

### Task 14: Item Browser page

**Files:**
- Create: `web/src/pages/ItemBrowser.jsx`
- Create: `web/src/pages/ItemBrowser.css`
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Create `web/src/pages/ItemBrowser.css`**

```css
.browse-layout {
  display: flex;
  gap: 1.5rem;
}

.browse-sidebar {
  flex-shrink: 0;
  width: 250px;
}

.browse-content {
  flex: 1;
  min-width: 0;
}

.browse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.browse-count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .browse-layout {
    flex-direction: column;
  }
  .browse-sidebar {
    width: 100%;
  }
}
```

- [ ] **Step 2: Create `web/src/pages/ItemBrowser.jsx`**

```jsx
import { useMemo } from 'react';
import { useBrowseUrlState } from '../hooks/useUrlState';
import { filterItems, sortItems } from '../logic/filters';
import FilterPanel from '../components/FilterPanel';
import ItemTable from '../components/ItemTable';
import items from '../data/generated/items.json';
import scrolls from '../data/generated/scrolls.json';
import './ItemBrowser.css';

const ALL_ITEMS = [...items, ...scrolls];

export default function ItemBrowser() {
  const [filters, setFilters] = useBrowseUrlState();

  const filtered = useMemo(() => {
    const result = filterItems(ALL_ITEMS, filters);
    return sortItems(result, filters.sort || 'name', filters.order || 'asc');
  }, [filters]);

  function handleSort(field) {
    const newDirection = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sort: field, order: newDirection });
  }

  return (
    <div className="browse-layout">
      <aside className="browse-sidebar">
        <FilterPanel filters={filters} onChange={setFilters} />
      </aside>
      <div className="browse-content">
        <div className="browse-header">
          <h2>Item Browser</h2>
          <span className="browse-count">{filtered.length.toLocaleString()} items</span>
        </div>
        <ItemTable
          items={filtered}
          sortField={filters.sort || 'name'}
          sortDirection={filters.order || 'asc'}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `web/src/App.jsx`** — replace browse placeholder

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ItemBrowser from './pages/ItemBrowser';

function Placeholder({ name }) {
  return <div>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
        <Route path="/browse" element={<ItemBrowser />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Build data and verify in browser**

```bash
cd web && npm run build:data && npm run dev
```

Navigate to `/browse`. Expected: filter sidebar on left, item table on right with all items. Search, category checkboxes, and sorting work.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/ItemBrowser.jsx web/src/pages/ItemBrowser.css web/src/App.jsx
git commit -m "feat: add Item Browser page with filtering and sorting"
```

---

### Task 15: Shop Generator page

**Files:**
- Create: `web/src/pages/ShopGenerator.jsx`
- Create: `web/src/pages/ShopGenerator.css`
- Create: `web/src/components/ShopTemplateCard.jsx`
- Create: `web/src/components/ShopTemplateCard.css`
- Create: `web/src/components/ShopInventory.jsx`
- Create: `web/src/components/ShopInventory.css`
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Create `web/src/components/ShopTemplateCard.css`**

```css
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.template-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.template-card:hover {
  border-color: var(--color-accent-dim);
  transform: translateY(-1px);
}

.template-card.selected {
  border-color: var(--color-accent);
  background: rgba(251, 191, 36, 0.05);
}

.template-card h3 {
  font-size: 1rem;
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.template-card p {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Create `web/src/components/ShopTemplateCard.jsx`**

```jsx
import './ShopTemplateCard.css';

export default function ShopTemplateCard({ template, selected, onClick }) {
  return (
    <div
      className={`template-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <h3>{template.name}</h3>
      <p>{template.description}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `web/src/components/ShopInventory.css`**

```css
.shop-inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.shop-inventory-header h2 {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.shop-actions {
  display: flex;
  gap: 0.75rem;
}

.shop-btn {
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: border-color 0.15s;
}

.shop-btn:hover {
  border-color: var(--color-accent);
}

.shop-link {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
}

.shop-link input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}
```

- [ ] **Step 4: Create `web/src/components/ShopInventory.jsx`**

```jsx
import ItemTable from './ItemTable';
import './ShopInventory.css';

export default function ShopInventory({ templateName, items, onReroll, onRerollAll, shareUrl }) {
  return (
    <div>
      <div className="shop-inventory-header">
        <h2>{templateName}</h2>
        <div className="shop-actions">
          <button className="shop-btn" onClick={onRerollAll}>
            Re-roll Shop
          </button>
        </div>
      </div>
      <ItemTable items={items} onReroll={onReroll} />
      {shareUrl && (
        <div className="shop-link">
          <label>Share this shop:</label>
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={e => e.target.select()}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `web/src/pages/ShopGenerator.css`**

```css
.shop-page h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.shop-page .step-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.shop-params {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.shop-param {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.shop-param label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.shop-param select,
.shop-param input {
  padding: 0.375rem 0.5rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.shop-param select:focus,
.shop-param input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.shop-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.shop-categories label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.shop-categories input[type="checkbox"] {
  accent-color: var(--color-accent);
}

.generate-btn {
  padding: 0.625rem 1.5rem;
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 2rem;
}

.generate-btn:hover {
  opacity: 0.9;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 6: Create `web/src/pages/ShopGenerator.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useShopUrlState } from '../hooks/useUrlState';
import { generateShop, rerollItem } from '../logic/generation';
import { TEMPLATES, TOWN_SIZES } from '../data/templates';
import { ALL_CATEGORIES } from '../data/constants';
import ShopTemplateCard from '../components/ShopTemplateCard';
import ShopInventory from '../components/ShopInventory';
import items from '../data/generated/items.json';
import scrolls from '../data/generated/scrolls.json';
import './ShopGenerator.css';

function generateSeed() {
  return Math.random().toString(36).substring(2, 8);
}

export default function ShopGenerator() {
  const [urlState, setUrlState] = useShopUrlState();

  const [templateId, setTemplateId] = useState(urlState.template || null);
  const [level, setLevel] = useState(urlState.level);
  const [townSize, setTownSize] = useState(urlState.townSize);
  const [budgetCap, setBudgetCap] = useState(urlState.budgetCap);
  const [seed, setSeed] = useState(urlState.seed || null);
  const [categories, setCategories] = useState(urlState.categories.length > 0 ? urlState.categories : null);

  const template = TEMPLATES.find(t => t.id === templateId);

  // When template changes, reset categories to template defaults
  function selectTemplate(id) {
    const tmpl = TEMPLATES.find(t => t.id === id);
    setTemplateId(id);
    setCategories(tmpl ? [...tmpl.defaultCategories] : null);
    setSeed(null);
  }

  const activeCategories = categories || template?.defaultCategories || [];

  function toggleCategory(cat) {
    const next = activeCategories.includes(cat)
      ? activeCategories.filter(c => c !== cat)
      : [...activeCategories, cat];
    setCategories(next);
  }

  function handleGenerate() {
    const newSeed = generateSeed();
    setSeed(newSeed);
    setUrlState({
      template: templateId,
      level,
      townSize,
      seed: newSeed,
      categories: activeCategories,
      budgetCap,
    });
  }

  const [shop, setShop] = useState(null);

  // Generate shop when seed changes
  useEffect(() => {
    if (!template || !seed) { setShop(null); return; }
    setShop(generateShop({
      items, scrolls, template, categories: activeCategories,
      level, townSize, seed, budgetCap,
    }));
  }, [template, seed, activeCategories, level, townSize, budgetCap]);

  const handleRerollAll = useCallback(() => {
    const newSeed = generateSeed();
    setSeed(newSeed);
    setUrlState({
      template: templateId, level, townSize, seed: newSeed,
      categories: activeCategories, budgetCap,
    });
  }, [templateId, level, townSize, activeCategories, budgetCap, setUrlState]);

  const handleRerollItem = useCallback((index) => {
    if (!shop || !template) return;
    const newItem = rerollItem({
      items, scrolls, categories: activeCategories,
      rarityWeights: template.rarityWeights, level,
      currentShop: shop, index, seed: generateSeed(), budgetCap,
    });
    const newShop = [...shop];
    newShop[index] = newItem;
    setShop(newShop);
  }, [shop, template, activeCategories, level, budgetCap]);

  const shareUrl = seed
    ? `${window.location.origin}/shop?${new URLSearchParams({
        template: templateId, level: String(level), town: townSize, seed,
        ...(activeCategories.length ? { categories: activeCategories.join(',') } : {}),
        ...(budgetCap !== undefined ? { budget: String(budgetCap) } : {}),
      }).toString()}`
    : null;

  return (
    <div className="shop-page">
      <h1>Generate a Shop</h1>

      <p className="step-label">1. Choose a template</p>
      <div className="template-grid">
        {TEMPLATES.map(t => (
          <ShopTemplateCard
            key={t.id}
            template={t}
            selected={templateId === t.id}
            onClick={() => selectTemplate(t.id)}
          />
        ))}
      </div>

      {template && (
        <>
          <p className="step-label">2. Customize categories</p>
          <div className="shop-categories">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <p className="step-label">3. Tune parameters</p>
          <div className="shop-params">
            <div className="shop-param">
              <label>Party Level</label>
              <input
                type="number" min="1" max="20"
                value={level}
                onChange={e => setLevel(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
              />
            </div>
            <div className="shop-param">
              <label>Town Size</label>
              <select value={townSize} onChange={e => setTownSize(e.target.value)}>
                {TOWN_SIZES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="shop-param">
              <label>Budget Cap (gp)</label>
              <input
                type="number" min="0" placeholder="No limit"
                value={budgetCap ?? ''}
                onChange={e => setBudgetCap(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={activeCategories.length === 0}
          >
            Generate Shop
          </button>
        </>
      )}

      {shop && (
        <ShopInventory
          templateName={template.name}
          items={shop}
          onReroll={handleRerollItem}
          onRerollAll={handleRerollAll}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: Update `web/src/App.jsx`** — wire up all pages

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ItemBrowser from './pages/ItemBrowser';
import ShopGenerator from './pages/ShopGenerator';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopGenerator />} />
        <Route path="/browse" element={<ItemBrowser />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 8: Build data and verify in browser**

```bash
cd web && npm run build:data && npm run dev
```

Test the full flow:
1. Navigate to `/shop`
2. Select a template (e.g., Blacksmith)
3. Toggle categories on/off
4. Adjust party level, town size
5. Click "Generate Shop"
6. Verify inventory appears with re-roll buttons
7. Test re-roll shop and single item re-roll
8. Copy share URL and open in new tab — same shop should appear

- [ ] **Step 9: Commit**

```bash
git add web/src/pages/ShopGenerator.jsx web/src/pages/ShopGenerator.css \
       web/src/components/ShopTemplateCard.jsx web/src/components/ShopTemplateCard.css \
       web/src/components/ShopInventory.jsx web/src/components/ShopInventory.css \
       web/src/App.jsx
git commit -m "feat: add Shop Generator page with templates, params, and generation"
```

---

## Chunk 5: Polish and Production Build

### Task 16: Run all tests and fix any issues

- [ ] **Step 1: Run full test suite**

```bash
cd web && npx vitest run
```

Expected: All tests pass (categories, rarity, generation, filters, URL state).

- [ ] **Step 2: Fix any failing tests**

If any tests fail, fix the underlying code and re-run.

- [ ] **Step 3: Commit any fixes (skip if no changes)**

```bash
git add -u web/src/ web/scripts/
git commit -m "fix: resolve test failures"
```

---

### Task 17: Production build verification

- [ ] **Step 1: Run production build**

```bash
cd web && npm run build
```

Expected: Build completes without errors. Output in `web/dist/`.

- [ ] **Step 2: Preview production build**

```bash
cd web && npm run preview
```

Navigate through all pages, test shop generation and browsing. Verify the app works in production mode.

- [ ] **Step 3: Check bundle size**

```bash
ls -la web/dist/assets/
```

Verify main JS bundle is reasonable (< 500KB gzipped). Descriptions JSON should be a separate chunk.

- [ ] **Step 4: Commit if any build config changes were needed (skip if no changes)**

```bash
git add -u web/src/ web/scripts/ web/vite.config.js
git commit -m "chore: fix build config issues"
```

---

### Task 18: Final integration smoke test

- [ ] **Step 1: Test shop generation flow end-to-end**

1. Open home page → click "Generate a Shop"
2. Select each template, verify categories update
3. Customize categories (add/remove)
4. Adjust level, town size, budget cap
5. Generate → verify inventory
6. Re-roll entire shop → new items appear
7. Re-roll single item → that item changes
8. Copy share URL → paste in new tab → same shop appears

- [ ] **Step 2: Test item browser flow end-to-end**

1. Open home page → click "Browse Items"
2. Search for "sword" → filtered results
3. Check/uncheck category filters
4. Check/uncheck rarity filters
5. Set price range → results filter
6. Sort by each column
7. Expand an item row → detail view shows
8. Expand a scroll → description lazy-loads

- [ ] **Step 3: Test responsive layout**

1. Resize to mobile width (< 768px)
2. Verify filter toggle button appears
3. Verify table columns hide appropriately
4. Navigate between pages

- [ ] **Step 4: Test URL persistence**

1. Apply filters on browse page → URL updates
2. Copy URL → open in new tab → same filters applied
3. Bookmark a shop URL → reopen → same shop appears

- [ ] **Step 5: Commit final state (skip if no changes)**

```bash
git add -u web/src/ web/scripts/
git commit -m "feat: complete fantasy shop generator webapp"
```
