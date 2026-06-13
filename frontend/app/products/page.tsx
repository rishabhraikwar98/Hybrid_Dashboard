import { fetchProducts } from '@/lib/api';
import { ProductsResponse } from '@/lib/types';
import ProductsClient from './ProductsClient';
import { Button } from '@/components/ui/button';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  
  const resolvedParams = await searchParams;

  const params = {
    page:     resolvedParams.page     || '1',
    limit:    resolvedParams.limit    || '12',
    search:   resolvedParams.search   || '',
    category: resolvedParams.category || '',
    status:   resolvedParams.status   || '',
  };

  const data: ProductsResponse = await fetchProducts(params);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <a href="/products/new">
          <Button>+ Add Product</Button>
        </a>
      </div>
      <ProductsClient initialData={data} initialParams={params} />
    </main>
  );
}