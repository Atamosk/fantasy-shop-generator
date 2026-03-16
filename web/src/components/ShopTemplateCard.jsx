import './ShopTemplateCard.css';

export default function ShopTemplateCard({ template, selected, onClick }) {
  return (
    <div
      className={`template-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <h3>{template.name}</h3>
      <p>{template.description}</p>
    </div>
  );
}
