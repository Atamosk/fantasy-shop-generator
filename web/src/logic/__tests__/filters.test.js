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
