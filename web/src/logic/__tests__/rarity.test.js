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
    expect(result.Common).toBe(30);
    expect(result.Uncommon).toBe(49);
    expect(result.Rare).toBe(14);
    expect(result['Very Rare']).toBe(7);
  });

  it('shifts weight toward common at low levels', () => {
    const result = adjustRarityWeights(baseWeights, 1);
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
