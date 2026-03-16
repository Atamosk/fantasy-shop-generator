import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { TOWN_SIZES } from '../data/templates.js';

const VALID_TOWN_IDS = new Set(TOWN_SIZES.map(t => t.id));

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function parseShopParams(searchParams) {
  const template = searchParams.get('template') || null;
  const levelStr = searchParams.get('level');
  const level = levelStr && !isNaN(parseInt(levelStr, 10))
    ? Math.max(1, Math.min(20, parseInt(levelStr, 10)))
    : 5;
  const townRaw = searchParams.get('town') || 'town';
  const townSize = VALID_TOWN_IDS.has(townRaw) ? townRaw : 'town';
  const seed = searchParams.get('seed') || null;
  const categoriesRaw = searchParams.get('categories');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const budgetStr = searchParams.get('budget');
  const budgetCap = budgetStr && !isNaN(parseInt(budgetStr, 10))
    ? parseInt(budgetStr, 10)
    : undefined;

  return { template, level, townSize, seed, categories, budgetCap };
}

export function serializeShopParams({ template, level, townSize, seed, categories, budgetCap }) {
  const params = new URLSearchParams();
  if (template) params.set('template', template);
  if (level && level !== 5) params.set('level', String(level));
  if (townSize && townSize !== 'town') params.set('town', townSize);
  if (seed) params.set('seed', seed);
  if (categories?.length) params.set('categories', categories.join(','));
  if (budgetCap !== undefined) params.set('budget', String(budgetCap));
  return params;
}

export function parseBrowseParams(searchParams) {
  const query = searchParams.get('q') || '';
  const categoriesRaw = searchParams.get('category');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const raritiesRaw = searchParams.get('rarity');
  const rarities = raritiesRaw ? raritiesRaw.split(',').map(s => titleCase(s.trim())) : [];
  const minPriceStr = searchParams.get('minPrice');
  const minPrice = minPriceStr && !isNaN(parseInt(minPriceStr, 10))
    ? parseInt(minPriceStr, 10) : undefined;
  const maxPriceStr = searchParams.get('maxPrice');
  const maxPrice = maxPriceStr && !isNaN(parseInt(maxPriceStr, 10))
    ? parseInt(maxPriceStr, 10) : undefined;
  const spellLevelStr = searchParams.get('spellLevel');
  const spellLevel = spellLevelStr && !isNaN(parseInt(spellLevelStr, 10))
    ? parseInt(spellLevelStr, 10) : undefined;
  const spellSchool = searchParams.get('spellSchool') || undefined;
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  return { query, categories, rarities, minPrice, maxPrice, spellLevel, spellSchool, sort, order };
}

export function serializeBrowseParams({ query, categories, rarities, minPrice, maxPrice, spellLevel, spellSchool, sort, order }) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (categories?.length) params.set('category', categories.join(','));
  if (rarities?.length) params.set('rarity', rarities.join(','));
  if (minPrice !== undefined) params.set('minPrice', String(minPrice));
  if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
  if (spellLevel !== undefined) params.set('spellLevel', String(spellLevel));
  if (spellSchool) params.set('spellSchool', spellSchool);
  if (sort && sort !== 'name') params.set('sort', sort);
  if (order && order !== 'asc') params.set('order', order);
  return params;
}

export function useShopUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseShopParams(searchParams), [searchParams]);

  const setState = useCallback((newState) => {
    setSearchParams(serializeShopParams(newState), { replace: true });
  }, [setSearchParams]);

  return [state, setState];
}

export function useBrowseUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseBrowseParams(searchParams), [searchParams]);

  const setState = useCallback((newState) => {
    setSearchParams(serializeBrowseParams(newState), { replace: true });
  }, [setSearchParams]);

  return [state, setState];
}
