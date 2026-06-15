import type { MetadataRoute } from 'next';
import type { ProductsResponse } from '@/lib/types/shop.types';

const BASE_URL = 'https://boutique.bem.sn';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalogue`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${process.env.API_URL}/products?limit=200`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json: ProductsResponse = await res.json();
      productRoutes = json.data.map((product) => ({
        url: `${BASE_URL}/produits/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // sitemap dégrade proprement si l'API est indisponible
  }

  return [...staticRoutes, ...productRoutes];
}
