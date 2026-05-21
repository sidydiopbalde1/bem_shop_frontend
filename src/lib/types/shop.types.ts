export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  description?: string;
  stock: number;
  isApproved: boolean;
  category: { id: string; name: string; slug: string };
};

export type CartItem = {
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'price' | 'imageUrls'>;
  quantity: number;
};

export type ProductsResponse = {
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
};
