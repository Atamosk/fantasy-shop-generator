import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

function Placeholder({ name }) {
  return <div>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
        <Route path="/browse" element={<Placeholder name="Item Browser" />} />
      </Route>
    </Routes>
  );
}
