import ProductCard from './ProductCard';

type Props = {
  products: {
    id: string; name: string; price: number | string;
    stock: number; imageUrls: string[];
  }[];
  columns?: 2 | 3 | 4 | 5 | 6;
};

const gridClassMap: Record<number, string> = {
  2: 'product-grid-cols-2',
  3: 'product-grid-cols-3',
  4: 'product-grid-cols-4',
  5: 'product-grid-cols-5',
  6: 'product-grid-cols-6',
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
    <div className={gridClassMap[columns] ?? 'product-grid-cols-4'}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
