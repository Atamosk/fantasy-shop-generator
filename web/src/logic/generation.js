import seedrandom from 'seedrandom';
import { adjustRarityWeights } from './rarity.js';
import { TOWN_SIZES } from '../data/templates.js';

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

export function generateShop({ items, scrolls, template, categories, level, townSize, seed, budgetCap }) {
  const rng = seedrandom(seed);

  const allItems = [...items, ...scrolls];
  let pool = allItems.filter(item =>
    categories.includes(item.category) && item.rarity !== 'Artifact'
  );
  if (budgetCap !== undefined) {
    pool = pool.filter(item => item.price <= budgetCap);
  }

  if (pool.length === 0) return [];

  const weights = adjustRarityWeights(template.rarityWeights, level);
  const townConfig = TOWN_SIZES.find(t => t.id === townSize) || TOWN_SIZES.find(t => t.id === 'town');
  const targetSize = Math.max(3, Math.round(template.baseSize * townConfig.multiplier));

  const poolByRarity = {};
  for (const item of pool) {
    if (!poolByRarity[item.rarity]) poolByRarity[item.rarity] = [];
    poolByRarity[item.rarity].push(item);
  }
  const availableRarities = Object.keys(poolByRarity);

  const inventory = [];
  const usedNames = new Set();

  for (let i = 0; i < targetSize; i++) {
    let rarity = pickRarity(weights, rng);

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

  return inventory.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    return catCmp !== 0 ? catCmp : a.price - b.price;
  });
}

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

  const fallback = pool.filter(i => !usedNames.has(i.name));
  if (fallback.length > 0) {
    return fallback[Math.floor(rng() * fallback.length)];
  }

  return currentShop[index];
}
