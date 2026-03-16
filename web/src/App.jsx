import { Routes, Route } from 'react-router-dom';

function Placeholder({ name }) {
  return <div style={{ color: '#e7e5e4', padding: '2rem' }}>{name} — coming soon</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Home" />} />
      <Route path="/shop" element={<Placeholder name="Shop Generator" />} />
      <Route path="/browse" element={<Placeholder name="Item Browser" />} />
    </Routes>
  );
}
