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
