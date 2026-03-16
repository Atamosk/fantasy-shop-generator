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
