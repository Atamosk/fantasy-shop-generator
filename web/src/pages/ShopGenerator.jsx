import { useState, useEffect, useCallback } from 'react';
import { useShopUrlState } from '../hooks/useUrlState';
import { generateShop, rerollItem } from '../logic/generation';
import { TEMPLATES, TOWN_SIZES } from '../data/templates';
import { ALL_CATEGORIES } from '../data/constants';
import ShopTemplateCard from '../components/ShopTemplateCard';
import ShopInventory from '../components/ShopInventory';
import items from '../data/generated/items.json';
import scrolls from '../data/generated/scrolls.json';
import './ShopGenerator.css';

function generateSeed() {
  return Math.random().toString(36).substring(2, 8);
}

export default function ShopGenerator() {
  const [urlState, setUrlState] = useShopUrlState();

  const [templateId, setTemplateId] = useState(urlState.template || null);
  const [level, setLevel] = useState(urlState.level);
  const [townSize, setTownSize] = useState(urlState.townSize);
  const [budgetCap, setBudgetCap] = useState(urlState.budgetCap);
  const [seed, setSeed] = useState(urlState.seed || null);
  const [categories, setCategories] = useState(urlState.categories.length > 0 ? urlState.categories : null);

  const template = TEMPLATES.find(t => t.id === templateId);

  // When template changes, reset categories to template defaults
  function selectTemplate(id) {
    const tmpl = TEMPLATES.find(t => t.id === id);
    setTemplateId(id);
    setCategories(tmpl ? [...tmpl.defaultCategories] : null);
    setSeed(null);
  }

  const activeCategories = categories || template?.defaultCategories || [];

  function toggleCategory(cat) {
    const next = activeCategories.includes(cat)
      ? activeCategories.filter(c => c !== cat)
      : [...activeCategories, cat];
    setCategories(next);
  }

  function handleGenerate() {
    const newSeed = generateSeed();
    setSeed(newSeed);
    setUrlState({
      template: templateId,
      level,
      townSize,
      seed: newSeed,
      categories: activeCategories,
      budgetCap,
    });
  }

  const [shop, setShop] = useState(null);

  // Generate shop when seed changes
  useEffect(() => {
    if (!template || !seed) { setShop(null); return; }
    setShop(generateShop({
      items, scrolls, template, categories: activeCategories,
      level, townSize, seed, budgetCap,
    }));
  }, [template, seed, activeCategories, level, townSize, budgetCap]);

  const handleRerollAll = useCallback(() => {
    const newSeed = generateSeed();
    setSeed(newSeed);
    setUrlState({
      template: templateId, level, townSize, seed: newSeed,
      categories: activeCategories, budgetCap,
    });
  }, [templateId, level, townSize, activeCategories, budgetCap, setUrlState]);

  const handleRerollItem = useCallback((index) => {
    if (!shop || !template) return;
    const newItem = rerollItem({
      items, scrolls, categories: activeCategories,
      rarityWeights: template.rarityWeights, level,
      currentShop: shop, index, seed: generateSeed(), budgetCap,
    });
    const newShop = [...shop];
    newShop[index] = newItem;
    setShop(newShop);
  }, [shop, template, activeCategories, level, budgetCap]);

  const shareUrl = seed
    ? `${window.location.origin}/shop?${new URLSearchParams({
        template: templateId, level: String(level), town: townSize, seed,
        ...(activeCategories.length ? { categories: activeCategories.join(',') } : {}),
        ...(budgetCap !== undefined ? { budget: String(budgetCap) } : {}),
      }).toString()}`
    : null;

  return (
    <div className="shop-page">
      <h1>Generate a Shop</h1>

      <p className="step-label">1. Choose a template</p>
      <div className="template-grid">
        {TEMPLATES.map(t => (
          <ShopTemplateCard
            key={t.id}
            template={t}
            selected={templateId === t.id}
            onClick={() => selectTemplate(t.id)}
          />
        ))}
      </div>

      {template && (
        <>
          <p className="step-label">2. Customize categories</p>
          <div className="shop-categories">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <p className="step-label">3. Tune parameters</p>
          <div className="shop-params">
            <div className="shop-param">
              <label>Party Level</label>
              <input
                type="number" min="1" max="20"
                value={level}
                onChange={e => setLevel(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
              />
            </div>
            <div className="shop-param">
              <label>Town Size</label>
              <select value={townSize} onChange={e => setTownSize(e.target.value)}>
                {TOWN_SIZES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="shop-param">
              <label>Budget Cap (gp)</label>
              <input
                type="number" min="0" placeholder="No limit"
                value={budgetCap ?? ''}
                onChange={e => setBudgetCap(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={activeCategories.length === 0}
          >
            Generate Shop
          </button>
        </>
      )}

      {shop && (
        <ShopInventory
          templateName={template.name}
          items={shop}
          onReroll={handleRerollItem}
          onRerollAll={handleRerollAll}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}
