const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];

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
