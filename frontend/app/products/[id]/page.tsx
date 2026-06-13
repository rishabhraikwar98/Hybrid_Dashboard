import { fetchProduct } from '@/lib/api';
import { notFound } from 'next/navigation';
import EditProductForm from "./EditProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const data = await fetchProduct(id);
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Product</h1>
        <EditProductForm product={data.product} />
      </main>
    );
  } catch {
    notFound();
  }
}