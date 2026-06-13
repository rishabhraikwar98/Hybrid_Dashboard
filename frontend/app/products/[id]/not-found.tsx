import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
      <p className="text-slate-500 mb-6">This product may have been deleted or doesn't exist.</p>
      <Link href="/products">
        <Button>Back to Products</Button>
      </Link>
    </main>
  );
}