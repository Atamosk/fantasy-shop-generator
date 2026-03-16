import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <h1>Fantasy Shop Generator</h1>
      <p className="subtitle">
        Generate shop inventories for your tabletop RPG sessions, or browse the full item catalog.
      </p>
      <div className="home-actions">
        <Link to="/shop" className="home-card">
          <h2>Generate a Shop</h2>
          <p>Pick a template, tune parameters, and generate a thematic inventory.</p>
        </Link>
        <Link to="/browse" className="home-card">
          <h2>Browse Items</h2>
          <p>Search and filter the full catalog of items, spells, and scrolls.</p>
        </Link>
      </div>
    </div>
  );
}
