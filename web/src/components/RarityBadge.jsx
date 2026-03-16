import { RARITY_COLORS } from '../data/constants';
import './RarityBadge.css';

export default function RarityBadge({ rarity }) {
  const color = RARITY_COLORS[rarity] || '#9ca3af';
  return (
    <span className="rarity-badge" style={{ color, borderLeft: `3px solid ${color}` }}>
      {rarity}
    </span>
  );
}
