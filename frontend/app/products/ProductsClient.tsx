'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Product, ProductsResponse } from '@/lib/types';
import { fetchProducts, toggleStock, deleteProduct } from '@/lib/api';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  initialData: ProductsResponse;
  initialParams: Record<string, string>;
}

export default function ProductsClient({ initialData, initialParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── State ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [total, setTotal] = useState(initialData.total);
  const [pages, setPages] = useState(initialData.pages);
  const [categoryCounts, setCategoryCounts] = useState(initialData.categoryCounts);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(initialParams.search);
  const [category, setCategory] = useState(initialParams.category || 'all');
  const [status, setStatus] = useState(initialParams.status || 'all');
  const [page, setPage] = useState(Number(initialParams.page) || 1);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // AbortController ref to cancel stale requests
  const abortRef = useRef<AbortController | null>(null);
  // sequence number to ignore out-of-order responses
  const seqRef = useRef(0);

  // ── URL sync helper ──────────────────────────────────────────────────────
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') qs.set(k, v);
      });
      // router.replace keeps URL in sync WITHOUT a full page reload
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  // ── Core fetch (client-side, after initial SSR load) ─────────────────────
  const fetchData = useCallback(
    async (params: {
      search: string;
      category: string;
      status: string;
      page: number;
    }) => {
      // cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // stamp this request with a sequence number
      const seq = ++seqRef.current;

      setLoading(true);

      try {
        const data: ProductsResponse = await fetchProducts(
          {
            page: String(params.page),
            limit: '12',
            search: params.search,
            category: params.category === 'all' ? '' : params.category,
            status: params.status === 'all' ? '' : params.status,
          },
          controller.signal // pass signal to fetch
        );

        // ignore response if a newer request has already fired
        if (seq !== seqRef.current) return;

        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
        setCategoryCounts(data.categoryCounts);
      } catch (err: any) {
        if (err.name === 'AbortError') return; // silently ignore aborted
        toast.error('Failed to load products');
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    },
    []
  );

  // ── Debounced search (300ms) ──────────────────────────────────────────────
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateURL({ search: value, category, status, page: '1' });
      fetchData({ search: value, category, status, page: 1 });
    }, 300);
  };

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
    updateURL({ search, category: value, status, page: '1' });
    fetchData({ search, category: value, status, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    updateURL({ search, category, status: value, page: '1' });
    fetchData({ search, category, status: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ search, category, status, page: String(newPage) });
    fetchData({ search, category, status, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Optimistic stock toggle ───────────────────────────────────────────
  const handleToggleStock = async (product: Product) => {
    const newStock = product.stock > 0 ? 0 : 1;
    const previousStock = product.stock;

    // Optimistic update — update UI immediately before server responds
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, stock: newStock } : p))
    );

    try {
      await toggleStock(product._id, newStock);
      toast.success(`Marked as ${newStock > 0 ? 'in stock' : 'out of stock'}`);
    } catch (err: any) {
      // Rollback — restore previous stock value on failure
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, stock: previousStock } : p
        )
      );
      toast.error('Stock update failed', {
        description: 'Rolled back to previous state.',
      });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p._id !== deleteId));
      setTotal((prev) => prev - 1);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // ── Sync state if user navigates back/forward ─────────────────────────────
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const c = searchParams.get('category') || 'all';
    const st = searchParams.get('status') || 'all';
    const p = Number(searchParams.get('page') || '1');
    setSearch(s);
    setCategory(c);
    setStatus(st);
    setPage(p);
  }, [searchParams]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search — 5.1 AbortController + debounce */}
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="sm:w-64"
        />

        {/* Category filter — live counts */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Categories ({total})
            </SelectItem>
            {categoryCounts.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c._id} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-slate-500 self-center ml-auto">
          {total} products
        </p>
      </div>

      {/* ── Product Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product._id} className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold line-clamp-1">
                  {product.name}
                </CardTitle>
                <p className="text-xs text-slate-500">{product.category}</p>
              </CardHeader>

              <CardContent className="pb-2">
                <p className="text-slate-600 text-xs line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">
                    ${product.price.toFixed(2)}
                  </span>
                  {/* 5.2 — stock badge reflects optimistic state immediately */}
                  <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-2">
                {/* View/Edit */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  Edit
                </Button>

                {/* 5.2 — Optimistic stock toggle */}
                <Button
                  variant={product.stock > 0 ? 'secondary' : 'default'}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggleStock(product)}
                >
                  {product.stock > 0 ? 'Mark Out' : 'Mark In'}
                </Button>

                {/* Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(product._id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 py-1 text-slate-400 text-sm">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => handlePageChange(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The product will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}