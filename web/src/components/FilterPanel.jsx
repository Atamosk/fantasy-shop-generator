import { useState } from 'react';
import { ALL_CATEGORIES, RARITIES } from '../data/constants';
import './FilterPanel.css';

const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];
const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function FilterPanel({ filters, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleCategory(cat) {
    const current = filters.categories || [];
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    onChange({ ...filters, categories: next });
  }

  function toggleRarity(rarity) {
    const current = filters.rarities || [];
    const next = current.includes(rarity) ? current.filter(r => r !== rarity) : [...current, rarity];
    onChange({ ...filters, rarities: next });
  }

  return (
    <>
      <button className="filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </button>
      <div className={`filter-panel${isOpen ? ' open' : ''}`}>
        <div className="filter-section filter-search">
          <h3>Search</h3>
          <input
            type="text"
            placeholder="Search items..."
            value={filters.query || ''}
            onChange={e => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <div className="filter-section">
          <h3>Category</h3>
          <div className="filter-checkboxes">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={!filters.categories?.length || filters.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Rarity</h3>
          <div className="filter-checkboxes">
            {RARITIES.map(r => (
              <label key={r}>
                <input
                  type="checkbox"
                  checked={!filters.rarities?.length || filters.rarities.includes(r)}
                  onChange={() => toggleRarity(r)}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        {/* Spell filters only shown when Scroll category is selected */}
        {(!filters.categories?.length || filters.categories.includes('Scroll')) && (
        <div className="filter-section">
          <h3>Spell Level</h3>
          <select
            value={filters.spellLevel ?? ''}
            onChange={e => onChange({ ...filters, spellLevel: e.target.value ? Number(e.target.value) : undefined })}
            style={{ width: '100%', padding: '0.375rem 0.5rem', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
          >
            <option value="">Any level</option>
            {SPELL_LEVELS.map(l => (
              <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>
            ))}
          </select>
        </div>

        <div className="filter-section">
          <h3>Spell School</h3>
          <select
            value={filters.spellSchool ?? ''}
            onChange={e => onChange({ ...filters, spellSchool: e.target.value || undefined })}
            style={{ width: '100%', padding: '0.375rem 0.5rem', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
          >
            <option value="">Any school</option>
            {SPELL_SCHOOLS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        )}

        <div className="filter-section">
          <h3>Price Range (gp)</h3>
          <div className="filter-range">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ''}
              onChange={e => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ''}
              onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
