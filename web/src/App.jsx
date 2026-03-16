import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ItemBrowser from './pages/ItemBrowser';

function Placeholder({ name }) {
  return <div>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
        <Route path="/browse" element={<ItemBrowser />} />
      </Route>
    </Routes>
  );
}
