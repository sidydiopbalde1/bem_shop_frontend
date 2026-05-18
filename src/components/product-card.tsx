import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  imageUrls: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const isSoldOut = product.stock === 0;
  const imageUrl = product.imageUrls?.[0];
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

  return (
    <Link href={`/produits/${product.id}`} className="group block">
      <div className="relative bg-gray-100 aspect-square overflow-hidden rounded-sm">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-xs">Image à venir</span>
          </div>
        )}
        {isSoldOut && (
          <span className="absolute top-2 left-2 bg-white/90 text-gray-800 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-sm text-gray-600 mt-0.5">
          {isSoldOut ? (
            <span className="text-gray-400">Épuisé</span>
          ) : (
            `${price.toLocaleString("fr-FR")} FCFA`
          )}
        </p>
      </div>
    </Link>
  );
}
