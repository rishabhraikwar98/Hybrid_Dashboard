import { Suspense } from 'react';
import AddProductForm from './AddProductForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewProductPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add Product</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AddProductForm />
      </Suspense>
    </main>
  );
}