import { useState, useEffect } from 'react';
import './ItemDetail.css';

export default function ItemDetail({ item }) {
  const [description, setDescription] = useState(null);

  useEffect(() => {
    // Lazy-load descriptions for spells/scrolls
    const spellName = item.spellName || item.name;
    if (item.category === 'Scroll' || item.level !== undefined) {
      import('../data/generated/descriptions.json')
        .then(mod => {
          setDescription(mod.default?.[spellName] || null);
        })
        .catch(() => setDescription(null));
    }
  }, [item]);

  return (
    <div className="item-detail">
      {item.base_item && (
        <div className="item-detail-field">
          <span className="item-detail-label">Base item:</span>
          <span>{item.base_item}</span>
        </div>
      )}
      {item.requirements && (
        <div className="item-detail-field">
          <span className="item-detail-label">Requires:</span>
          <span>{item.requirements}</span>
        </div>
      )}
      {item.sourceBook && (
        <div className="item-detail-field">
          <span className="item-detail-label">Source:</span>
          <span>{item.sourceBook}</span>
        </div>
      )}
      {item.spellLevel !== undefined && (
        <div className="item-detail-field">
          <span className="item-detail-label">Spell level:</span>
          <span>{item.spellLevel === 0 ? 'Cantrip' : item.spellLevel}</span>
        </div>
      )}
      {item.spellSchool && (
        <div className="item-detail-field">
          <span className="item-detail-label">School:</span>
          <span>{item.spellSchool}</span>
        </div>
      )}
      {description && (
        <div className="item-detail-description">{description}</div>
      )}
    </div>
  );
}
