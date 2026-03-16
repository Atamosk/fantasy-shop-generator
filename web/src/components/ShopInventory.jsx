import ItemTable from './ItemTable';
import './ShopInventory.css';

export default function ShopInventory({ templateName, items, onReroll, onRerollAll, shareUrl }) {
  return (
    <div>
      <div className="shop-inventory-header">
        <h2>{templateName}</h2>
        <div className="shop-actions">
          <button className="shop-btn" onClick={onRerollAll}>
            Re-roll Shop
          </button>
        </div>
      </div>
      <ItemTable items={items} onReroll={onReroll} />
      {shareUrl && (
        <div className="shop-link">
          <label>Share this shop:</label>
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={e => e.target.select()}
          />
        </div>
      )}
    </div>
  );
}
