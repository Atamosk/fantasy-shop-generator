import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ItemBrowser from './pages/ItemBrowser';
import ShopGenerator from './pages/ShopGenerator';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopGenerator />} />
        <Route path="/browse" element={<ItemBrowser />} />
      </Route>
    </Routes>
  );
}
