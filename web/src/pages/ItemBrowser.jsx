import { useMemo } from 'react';
import { useBrowseUrlState } from '../hooks/useUrlState';
import { filterItems, sortItems } from '../logic/filters';
import FilterPanel from '../components/FilterPanel';
import ItemTable from '../components/ItemTable';
import items from '../data/generated/items.json';
import scrolls from '../data/generated/scrolls.json';
import './ItemBrowser.css';

const ALL_ITEMS = [...items, ...scrolls];

export default function ItemBrowser() {
  const [filters, setFilters] = useBrowseUrlState();

  const filtered = useMemo(() => {
    const result = filterItems(ALL_ITEMS, filters);
    return sortItems(result, filters.sort || 'name', filters.order || 'asc');
  }, [filters]);

  function handleSort(field) {
    const newDirection = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sort: field, order: newDirection });
  }

  return (
    <div className="browse-layout">
      <aside className="browse-sidebar">
        <FilterPanel filters={filters} onChange={setFilters} />
      </aside>
      <div className="browse-content">
        <div className="browse-header">
          <h2>Item Browser</h2>
          <span className="browse-count">{filtered.length.toLocaleString()} items</span>
        </div>
        <ItemTable
          items={filtered}
          sortField={filters.sort || 'name'}
          sortDirection={filters.order || 'asc'}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}
