import ProductCard from './ProductCard';

type Props = {
  products: {
    id: string; name: string; price: number | string;
    stock: number; imageUrls: string[];
  }[];
  columns?: 2 | 3 | 4 | 5 | 6;
};

export default function ProductGrid({ products, columns = 4 }: Props) {
  if (products.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: '14px' }}>
        Aucun produit disponible pour le moment.
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: '24px',
    }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
