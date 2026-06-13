export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  version: number;
  createdAt: string;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  pages: number;
  categoryCounts: { _id: string; count: number }[];
}