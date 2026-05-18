import Link from "next/link";
import ProductCard from "./product-card";

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  imageUrls: string[];
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch("http://localhost:3000/products?limit=4", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? json ?? [];
  } catch {
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getProducts();
console.log(products);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Les indispensables BEM</h2>
        <Link
          href="/catalogue"
          className="text-sm font-medium text-gray-600 hover:text-[#c8102e] transition-colors underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
