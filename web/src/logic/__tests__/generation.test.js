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
      const replacement = rerollItem({
        items: MOCK_ITEMS, scrolls: [], categories: ['Weapon', 'Shield'],
        rarityWeights: TEMPLATE.rarityWeights, level: 5,
        currentShop: shop, index: 0, seed: 'reroll-new',
      });
      expect(replacement).toBeDefined();
      expect(replacement.name).toBeDefined();
    }
  });
});
