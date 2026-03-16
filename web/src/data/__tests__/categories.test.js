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
