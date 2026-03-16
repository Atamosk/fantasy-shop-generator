import { useState, useEffect, Fragment } from 'react';
import RarityBadge from './RarityBadge';
import ItemDetail from './ItemDetail';
import './ItemTable.css';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category', className: 'hide-mobile' },
  { key: 'price', label: 'Price (gp)' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'weight', label: 'Weight', className: 'hide-mobile' },
];

const PAGE_SIZE = 50;

export default function ItemTable({ items, sortField, sortDirection, onSort, onReroll }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [page, setPage] = useState(0);

  // Reset page to 0 when items change (new filters applied)
  useEffect(() => { setPage(0); }, [items.length]);
  // Reset expanded row when page changes
  useEffect(() => { setExpandedIndex(null); }, [page]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pagedItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(field) {
    if (onSort) onSort(field);
  }

  function toggleExpand(index) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  if (items.length === 0) {
    return <div className="item-table-empty">No items match your filters.</div>;
  }

  return (
    <>
    <table className="item-table">
      <thead>
        <tr>
          {COLUMNS.map(col => (
            <th key={col.key} className={col.className} onClick={() => handleSort(col.key)}>
              {col.label}
              {sortField === col.key && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
          ))}
          {onReroll && <th />}
        </tr>
      </thead>
      <tbody>
        {pagedItems.map((item, i) => (
          <Fragment key={`${item.name}-${item.category}-${item.price}`}>
            <tr
              className={`clickable-row${expandedIndex === i ? ' expanded' : ''}`}
              onClick={() => toggleExpand(i)}
            >
              <td>{item.name}</td>
              <td className="hide-mobile">{item.category}</td>
              <td className="price">{item.price.toLocaleString()} gp</td>
              <td><RarityBadge rarity={item.rarity} /></td>
              <td className="hide-mobile weight">{item.weight ?? '—'}</td>
              {onReroll && (
                <td>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReroll(i); }}
                    title="Re-roll this item"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem' }}
                  >
                    ⟳
                  </button>
                </td>
              )}
            </tr>
            {expandedIndex === i && (
              <tr>
                <td colSpan={COLUMNS.length + (onReroll ? 1 : 0)}>
                  <ItemDetail item={item} />
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
    {totalPages > 1 && (
      <div className="item-table-pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
      </div>
    )}
    </>
  );
}
