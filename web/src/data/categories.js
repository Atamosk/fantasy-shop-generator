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
