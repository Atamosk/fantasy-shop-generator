import { Link, NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <>
      <header className="layout-header">
        <Link to="/" className="layout-logo">Fantasy Shop Generator</Link>
        <nav className="layout-nav">
          <NavLink to="/shop">Generate Shop</NavLink>
          <NavLink to="/browse">Browse Items</NavLink>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </>
  );
}
