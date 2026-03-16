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
